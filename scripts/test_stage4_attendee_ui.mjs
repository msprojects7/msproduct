import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  attendees,
  auditEvents,
} from '../db/schema/index';
import { eq } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage4UITests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 4 ATTENDEE UI & INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, level = 'UI TEST') {
    if (condition) {
      console.log(`✓ [${level}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${level}] FAIL: ${message}`);
      failed++;
    }
  }

  // Check dev server online
  let devServerOnline = false;
  try {
    const hc = await fetch(`${APP_URL}/api/health`);
    if (hc.ok) devServerOnline = true;
  } catch {
    devServerOnline = false;
  }

  if (!devServerOnline) {
    console.error('Dev server not detected on 3333. Launching required for UI integration tests.');
    process.exit(1);
  }

  const ts = Date.now();
  let orgId = '';
  let eventId = '';
  let eventSlug = `ui-test-ev-${ts}`;
  let ownerUser = null;
  let scannerUser = null;

  try {
    const signUpUser = async (email, name) => {
      const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
        body: JSON.stringify({ email, password: 'Password123!@#Test', name }),
      });
      const data = await res.json();
      const setCookies = res.headers.getSetCookie?.() || [res.headers.get('set-cookie') || ''];
      const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
      return { user: data.user, cookies };
    };

    ownerUser = await signUpUser(`ui-owner-${ts}@example.com`, 'UI Owner');
    scannerUser = await signUpUser(`ui-scanner-${ts}@example.com`, 'UI Scanner');

    // TEST 1: Unauthenticated user accessing /events/[eventSlug]/attendees
    const unauthUiRes = await fetch(`${APP_URL}/events/${eventSlug}/attendees`, {
      redirect: 'manual',
    });
    // Next.js page or middleware either responds with redirect or 200 (client-side router pushes to /auth/sign-in)
    assert(
      unauthUiRes.status === 307 || unauthUiRes.status === 302 || unauthUiRes.status === 200,
      'Unauthenticated request to /events/[slug]/attendees handled safely without server crash',
      'UI ROUTE'
    );

    // Create Organization
    const orgRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `UI Test Org (${ts})`, slug: `ui-org-${ts}` }),
    });
    const orgData = await orgRes.json();
    orgId = orgData.organization.id;

    // Create Event
    const evRes = await fetch(`${APP_URL}/api/organizations/${orgId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `UI Test Event (${ts})`, slug: eventSlug }),
    });
    const evData = await evRes.json();
    eventId = evData.event.id;

    // Assign scanner operator
    await fetch(`${APP_URL}/api/events/${eventId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: scannerUser.user.id, role: 'scanner_operator' }),
    });

    // TEST 2: Authenticated Owner requests /events/[eventSlug]/attendees page HTML
    const ownerUiRes = await fetch(`${APP_URL}/events/${eventSlug}/attendees`, {
      headers: { 'Cookie': ownerUser.cookies },
      redirect: 'manual',
    });
    const htmlText = await ownerUiRes.text();

    assert(
      ownerUiRes.status === 200,
      `Authenticated manager fetches /events/[eventSlug]/attendees successfully (status: ${ownerUiRes.status}, location: ${ownerUiRes.headers.get('location')})`,
      'UI ROUTE'
    );

    // TEST 3: UI API Contract - Initial empty state returns 0 attendees
    const emptyListRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const emptyListData = await emptyListRes.json();
    assert(
      emptyListRes.status === 200 && emptyListData.attendees.length === 0 && emptyListData.pagination.totalCount === 0,
      'UI receives initial empty state data accurately (0 attendees, totalCount 0)',
      'UI CONTRACT'
    );

    // TEST 4: UI Register Attendee Form flow
    const createRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        registrationNumber: `REG-H-${ts}`,
        category: 'Faculty',
        phoneNumber: '+919876500000',
        email: `house_${ts}@diagnostics.org`,
        gender: 'Male',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'pre_registered',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 && createData.attendee.name === 'Dr. Gregory House',
      'Register attendee form submission returns 201 CREATED with new record',
      'UI CONTRACT'
    );
    const createdAttendeeId = createData.attendee.id;

    // TEST 5: UI Duplicate Registration Number validation
    const dupRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Imposter House',
        registrationNumber: `REG-H-${ts}`,
        category: 'Delegate',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.code === 'REGISTRATION_NUMBER_EXISTS',
      'UI form duplicate reg-no collision is caught with 409 and actionable error code',
      'UI CONTRACT'
    );

    // TEST 6: UI Search & Filter debounced contract
    const searchMatchRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees?search=Gregory`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const searchMatchData = await searchMatchRes.json();
    assert(
      searchMatchRes.status === 200 && searchMatchData.attendees.length === 1,
      'Debounced search query filters and returns matching attendee record',
      'UI CONTRACT'
    );

    const searchMissRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees?search=NonExistent`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const searchMissData = await searchMissRes.json();
    assert(
      searchMissRes.status === 200 && searchMissData.attendees.length === 0,
      'Search query with no matches yields empty list triggering UI empty-state',
      'UI CONTRACT'
    );

    // TEST 7: UI Edit Attendee Form flow
    const editRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/${createdAttendeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Gregory House, M.D.',
        foodPreference: 'Jain Food',
      }),
    });
    const editData = await editRes.json();
    assert(
      editRes.status === 200 && editData.attendee.name === 'Dr. Gregory House, M.D.',
      'Edit attendee form submission updates record cleanly (200 OK)',
      'UI CONTRACT'
    );

    // TEST 8: UI PII Masking: Scanner Operator fetches details
    const scannerDetailRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/${createdAttendeeId}`, {
      headers: { 'Cookie': scannerUser.cookies },
    });
    const scannerDetailData = await scannerDetailRes.json();
    assert(
      scannerDetailRes.status === 200 &&
      scannerDetailData.attendee.phoneNumber === null &&
      scannerDetailData.attendee.email === null,
      'UI View Details modal for Scanner Operator receives redacted PII from backend',
      'UI CONTRACT'
    );

    // TEST 9: UI Single Delete Confirmation flow
    const deleteRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/${createdAttendeeId}`, {
      method: 'DELETE',
      headers: { 'Cookie': ownerUser.cookies },
    });
    assert(
      deleteRes.status === 200,
      'Single delete confirmation action triggers successful DELETE /attendees/[id] (200 OK)',
      'UI CONTRACT'
    );

    // TEST 10: Verified record absent after deletion
    const verifyDelRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/${createdAttendeeId}`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    assert(
      verifyDelRes.status === 404,
      'Deleted attendee is immediately absent from workspace queries (404 NOT_FOUND)',
      'UI CONTRACT'
    );

    // TEST 11: Bulk Delete flow (create 2 attendees and bulk-delete them)
    const b1 = await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: 'Bulk Person 1', registrationNumber: `BULK-1-${ts}`, category: 'Delegate' }),
    });
    const b1Data = await b1.json();
    const b2 = await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: 'Bulk Person 2', registrationNumber: `BULK-2-${ts}`, category: 'Delegate' }),
    });
    const b2Data = await b2.json();

    const bulkDelRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ ids: [b1Data.attendee.id, b2Data.attendee.id] }),
    });
    const bulkDelData = await bulkDelRes.json();
    assert(
      bulkDelRes.status === 200 && bulkDelData.deletedCount === 2,
      'Bulk delete confirmation triggers successful bulk deletion with exact deletedCount (200 OK)',
      'UI CONTRACT'
    );

    // TEST 12: Stale-Data Handling (editing a deleted attendee returns 404)
    const staleEditRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees/${createdAttendeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: 'Phantom Edit' }),
    });
    assert(
      staleEditRes.status === 404,
      'Stale edit attempt on deleted attendee returns 404 NOT_FOUND',
      'UI CONTRACT'
    );

    // TEST 13: Pagination Contract (create 6 attendees, verify page=1&pageSize=3 and page=2)
    for (let i = 1; i <= 6; i++) {
      await fetch(`${APP_URL}/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({
          name: `Paginated Person ${i}`,
          registrationNumber: `PAG-${i}-${ts}`,
          category: i % 2 === 0 ? 'Faculty' : 'Delegate',
          paymentStatus: i % 2 === 0 ? 'Paid' : 'Unpaid',
        }),
      });
    }

    const page1Res = await fetch(`${APP_URL}/api/events/${eventId}/attendees?page=1&pageSize=3`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const page1Data = await page1Res.json();
    assert(
      page1Res.status === 200 && page1Data.attendees.length === 3 && page1Data.pagination.totalPages === 2,
      'Pagination: Page 1 with pageSize=3 returns exactly 3 records and calculates totalPages=2',
      'UI CONTRACT'
    );

    const page2Res = await fetch(`${APP_URL}/api/events/${eventId}/attendees?page=2&pageSize=3`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const page2Data = await page2Res.json();
    assert(
      page2Res.status === 200 && page2Data.attendees.length === 3 && page2Data.pagination.page === 2,
      'Pagination: Page 2 with pageSize=3 returns the remaining 3 records',
      'UI CONTRACT'
    );

    // TEST 14: Filtering by Category and Payment Status
    const facultyFilterRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees?category=Faculty`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const facultyFilterData = await facultyFilterRes.json();
    const allFaculty = facultyFilterData.attendees.every((a) => a.category === 'Faculty');
    assert(
      facultyFilterRes.status === 200 && facultyFilterData.attendees.length === 3 && allFaculty,
      'Category filter: returns strictly matching Faculty attendees',
      'UI CONTRACT'
    );

    const unpaidFilterRes = await fetch(`${APP_URL}/api/events/${eventId}/attendees?paymentStatus=Unpaid`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const unpaidFilterData = await unpaidFilterRes.json();
    const allUnpaid = unpaidFilterData.attendees.every((a) => a.paymentStatus === 'Unpaid');
    assert(
      unpaidFilterRes.status === 200 && unpaidFilterData.attendees.length === 3 && allUnpaid,
      'Payment filter: returns strictly matching Unpaid attendees',
      'UI CONTRACT'
    );

  } finally {
    if (orgId) {
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgId));
      await db.delete(organizations).where(eq(organizations.id, orgId));
    }
  }

  console.log('\n================================================================');
  console.log(`STAGE 4 UI TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runStage4UITests().catch((err) => {
  console.error('UI Test Suite error:', err);
  process.exit(1);
});
