import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  attendees,
  scanEvents,
  badgePrintEvents,
  auditEvents,
} from '../db/schema/index';
import { eq, and, sql } from 'drizzle-orm';
import { hasPermission, ROLE_PERMISSIONS } from '../lib/auth/permissions';

// Import Route Handlers for Level B verification
import { GET as getAttendeesRoute, POST as postAttendeesRoute } from '../app/api/events/[eventId]/attendees/route';
import { GET as getSingleAttendeeRoute, PATCH as patchSingleAttendeeRoute, DELETE as deleteSingleAttendeeRoute } from '../app/api/events/[eventId]/attendees/[attendeeId]/route';
import { POST as bulkDeleteAttendeesRoute } from '../app/api/events/[eventId]/attendees/bulk-delete/route';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage4BackendTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 4 ATTENDEE BACKEND & SECURITY TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, level = 'LEVEL A') {
    if (condition) {
      console.log(`✓ [${level}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${level}] FAIL: ${message}`);
      failed++;
    }
  }

  const ts = Date.now();
  const testOrgAId = `55555555-1111-4111-8111-${String(ts).slice(-12)}`;
  const testOrgBId = `55555555-2222-4222-8222-${String(ts).slice(-12)}`;

  const testEventAId = `66666666-1111-4111-8111-${String(ts).slice(-12)}`;
  const testEventBId = `66666666-2222-4222-8222-${String(ts).slice(-12)}`;

  let attendeeA1Id = '';
  let attendeeA2Id = '';
  let attendeeB1Id = '';

  try {
    // ========================================================================
    // SECTION 1: LEVEL A — DATABASE INVARIANTS & INTEGRITY (DIRECT DB)
    // ========================================================================
    console.log('--- SECTION 1: LEVEL A — DATABASE INVARIANTS & INTEGRITY ---');

    // Seed test organizations & events
    await db.insert(organizations).values([
      { id: testOrgAId, name: `Stage 4 Org A (${ts})`, slug: `s4-org-a-${ts}`, isActive: true },
      { id: testOrgBId, name: `Stage 4 Org B (${ts})`, slug: `s4-org-b-${ts}`, isActive: true },
    ]);

    await db.insert(events).values([
      { id: testEventAId, organizationId: testOrgAId, name: `Event Alpha (${ts})`, slug: `ev-alpha-${ts}` },
      { id: testEventBId, organizationId: testOrgBId, name: `Event Beta (${ts})`, slug: `ev-beta-${ts}` },
    ]);

    // Test A1: Scoped unique registration number in same event rejects duplicate
    const [insertedA1] = await db
      .insert(attendees)
      .values({
        eventId: testEventAId,
        registrationNumber: `REG-A-${ts}`,
        name: 'Dr. Alice Database',
        category: 'Faculty',
        phoneNumber: '+919876543210',
        email: `alice_${ts}@example.com`,
      })
      .returning();
    attendeeA1Id = insertedA1.id;

    let duplicateRejected = false;
    try {
      await db.insert(attendees).values({
        eventId: testEventAId,
        registrationNumber: `REG-A-${ts}`,
        name: 'Duplicate Reg Number',
        category: 'Delegate',
      });
    } catch (err) {
      if (err?.code === '23505' || err?.cause?.code === '23505') duplicateRejected = true;
    }
    assert(
      duplicateRejected,
      'PostgreSQL engine strictly rejects duplicate registration number in same event (23505 unique_violation)',
      'LEVEL A'
    );

    // Test A2: Same registration number across different events is permitted
    let crossEventDuplicateAllowed = false;
    try {
      const [insertedB1] = await db
        .insert(attendees)
        .values({
          eventId: testEventBId,
          registrationNumber: `REG-A-${ts}`,
          name: 'Bob in Event Beta',
          category: 'Delegate',
        })
        .returning();
      attendeeB1Id = insertedB1.id;
      crossEventDuplicateAllowed = true;
    } catch (err) {
      crossEventDuplicateAllowed = false;
    }
    assert(
      crossEventDuplicateAllowed,
      'Same registration number in different events is correctly permitted by scoped unique index',
      'LEVEL A'
    );

    // Test A3: Composite foreign keys prevent cross-event reference leakage
    let crossEventScanRejected = false;
    try {
      await db.insert(scanEvents).values({
        eventId: testEventBId,
        attendeeId: attendeeA1Id, // Attendee from Event A linked to Event B scan
        action: 'check_in',
        staffUserId: 'staff-test-user',
      });
    } catch (err) {
      if (err?.code === '23503' || err?.cause?.code === '23503') crossEventScanRejected = true;
    }
    assert(
      crossEventScanRejected,
      'Composite foreign key (attendee_id, event_id) rejects scan insert linking attendee to wrong event',
      'LEVEL A'
    );

    // Test A4: Cascade deletion of attendee cleanly cascades to child tables
    const [scanOnA] = await db
      .insert(scanEvents)
      .values({
        eventId: testEventAId,
        attendeeId: attendeeA1Id,
        action: 'check_in',
        staffUserId: 'staff-test-user',
      })
      .returning();

    await db.delete(attendees).where(eq(attendees.id, attendeeA1Id));
    const [remainingScan] = await db
      .select()
      .from(scanEvents)
      .where(eq(scanEvents.id, scanOnA.id));

    assert(
      !remainingScan,
      'Deleting attendee cleanly cascades to related child scan_events (ON DELETE CASCADE)',
      'LEVEL A'
    );

    // ========================================================================
    // SECTION 2: LEVEL B — ROUTE GUARDS & RBAC RULES IN ISOLATION
    // ========================================================================
    console.log('\n--- SECTION 2: LEVEL B — ROUTE GUARDS & RBAC IN ISOLATION ---');

    // Verify unauthenticated direct invocations
    const dummyReq = (method = 'GET', body = null) => {
      const init = { method };
      if (body) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(body);
      }
      return new Request(`${APP_URL}/api/events/${testEventAId}/attendees`, init);
    };

    const resB1 = await getAttendeesRoute(dummyReq('GET'), { params: { eventId: testEventAId } });
    assert(resB1.status === 401, 'Direct GET /attendees without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    const resB2 = await postAttendeesRoute(dummyReq('POST', { name: 'Test', registrationNumber: 'R1', category: 'Cat' }), { params: { eventId: testEventAId } });
    assert(resB2.status === 401, 'Direct POST /attendees without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    const resB3 = await getSingleAttendeeRoute(dummyReq('GET'), { params: { eventId: testEventAId, attendeeId: testEventAId } });
    assert(resB3.status === 401, 'Direct GET /attendees/[id] without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    const resB4 = await patchSingleAttendeeRoute(dummyReq('PATCH', { name: 'Update' }), { params: { eventId: testEventAId, attendeeId: testEventAId } });
    assert(resB4.status === 401, 'Direct PATCH /attendees/[id] without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    const resB5 = await deleteSingleAttendeeRoute(dummyReq('DELETE'), { params: { eventId: testEventAId, attendeeId: testEventAId } });
    assert(resB5.status === 401, 'Direct DELETE /attendees/[id] without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    const resB6 = await bulkDeleteAttendeesRoute(dummyReq('POST', { ids: [testEventAId] }), { params: { eventId: testEventAId } });
    assert(resB6.status === 401, 'Direct POST /attendees/bulk-delete without session cookies returns 401 UNAUTHENTICATED', 'LEVEL B');

    // Role-based permission matrix assertions
    assert(
      hasPermission('scanner_operator', 'event:view') === true &&
      hasPermission('scanner_operator', 'event:view_attendee_pii') === false,
      'RBAC: scanner_operator has event:view but is strictly denied event:view_attendee_pii',
      'LEVEL B'
    );

    assert(
      hasPermission('scanner_operator', 'event:create_attendee') === false &&
      hasPermission('scanner_operator', 'event:delete_attendee') === false,
      'RBAC: scanner_operator is strictly denied create and delete permissions',
      'LEVEL B'
    );

    assert(
      hasPermission('registration_staff', 'event:create_attendee') === true &&
      hasPermission('registration_staff', 'event:update_attendee') === true &&
      hasPermission('registration_staff', 'event:delete_attendee') === false,
      'RBAC: registration_staff can create and update attendees, but is strictly prohibited from deleting',
      'LEVEL B'
    );

    assert(
      hasPermission('event_manager', 'event:create_attendee') === true &&
      hasPermission('event_manager', 'event:update_attendee') === true &&
      hasPermission('event_manager', 'event:delete_attendee') === true,
      'RBAC: event_manager is authorized for full attendee lifecycle including deletion',
      'LEVEL B'
    );

    assert(
      hasPermission('org_member', 'event:view') === false,
      'RBAC: plain org_member lacks event:view and cannot access attendee records',
      'LEVEL B'
    );

    // ========================================================================
    // SECTION 3: LEVEL C — REAL HTTP SESSIONS & INTEGRATION (PORT 3333)
    // ========================================================================
    console.log('\n--- SECTION 3: LEVEL C — REAL HTTP INTEGRATION ON PORT 3333 ---');

    let devServerOnline = false;
    try {
      const hc = await fetch(`${APP_URL}/api/health`);
      if (hc.ok) devServerOnline = true;
    } catch {
      devServerOnline = false;
    }

    if (!devServerOnline) {
      console.log('Dev server not detected on 3333; skipping Level C real HTTP suite.');
    } else {
      console.log('✓ Dev server online on port 3333. Beginning Level C real HTTP suite...');

      const signUpUser = async (email, name) => {
        const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
          body: JSON.stringify({ email, password: 'Password123!@#Test', name }),
        });
        const data = await res.json();
        const cookies = res.headers.get('set-cookie') || '';
        return { user: data.user, cookies };
      };

      const ownerUser = await signUpUser(`sec4-owner-${ts}@example.com`, 'Attendee Owner');
      const regStaffUser = await signUpUser(`sec4-regstaff-${ts}@example.com`, 'Attendee Reg Staff');
      const scannerUser = await signUpUser(`sec4-scanner-${ts}@example.com`, 'Attendee Scanner');
      const outsiderUser = await signUpUser(`sec4-outsider-${ts}@example.com`, 'Attendee Outsider');

      // Owner creates organization
      const createOrgRes = await fetch(`${APP_URL}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({ name: `Stage 4 HTTP Org (${ts})`, slug: `s4-http-org-${ts}` }),
      });
      const createOrgData = await createOrgRes.json();
      const httpOrgId = createOrgData.organization.id;

      // Owner creates Event A
      const createEventRes = await fetch(`${APP_URL}/api/organizations/${httpOrgId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({ name: `Stage 4 HTTP Event A (${ts})`, slug: `s4-http-ev-a-${ts}` }),
      });
      const createEventData = await createEventRes.json();
      const httpEventAId = createEventData.event.id;

      // Assign staff to Event A
      await fetch(`${APP_URL}/api/events/${httpEventAId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({ userId: regStaffUser.user.id, role: 'registration_staff' }),
      });

      await fetch(`${APP_URL}/api/events/${httpEventAId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({ userId: scannerUser.user.id, role: 'scanner_operator' }),
      });

      // Outsider creates their own organization and Event B
      const outsiderOrgRes = await fetch(`${APP_URL}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
        body: JSON.stringify({ name: `Outsider Org (${ts})`, slug: `s4-outsider-org-${ts}` }),
      });
      const outsiderOrgData = await outsiderOrgRes.json();
      const outsiderOrgId = outsiderOrgData.organization.id;

      const outsiderEventRes = await fetch(`${APP_URL}/api/organizations/${outsiderOrgId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
        body: JSON.stringify({ name: `Outsider Event (${ts})`, slug: `s4-outsider-ev-${ts}` }),
      });
      const outsiderEventData = await outsiderEventRes.json();
      const outsiderEventId = outsiderEventData.event.id;

      // TEST C1: Owner registers Attendee 1
      const regAtt1Res = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({
          name: 'Dr. Jane Smith',
          registrationNumber: `REG-101-${ts}`,
          category: 'Faculty',
          phoneNumber: '+919988776655',
          email: `jane_${ts}@example.com`,
          gender: 'Female',
          medicalCouncilNumber: 'MCI-98765',
        }),
      });
      const regAtt1Data = await regAtt1Res.json();
      assert(
        regAtt1Res.status === 201 && regAtt1Data.attendee?.id,
        'Owner successfully created attendee via POST /attendees (201 CREATED)',
        'LEVEL C'
      );
      const httpAttendee1Id = regAtt1Data.attendee.id;

      // TEST C2: Duplicate registration number in same event rejected with 409
      const dupRegRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({
          name: 'Duplicate Reg Attendee',
          registrationNumber: `REG-101-${ts}`,
          category: 'Delegate',
        }),
      });
      const dupRegData = await dupRegRes.json();
      assert(
        dupRegRes.status === 409 && dupRegData.code === 'REGISTRATION_NUMBER_EXISTS',
        'Duplicate registration number within event returns 409 REGISTRATION_NUMBER_EXISTS',
        'LEVEL C'
      );

      // TEST C3: Registration staff registers Attendee 2 and Attendee 3
      const regAtt2Res = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
        body: JSON.stringify({
          name: 'Robert Jones',
          registrationNumber: `REG-102-${ts}`,
          category: 'Delegate',
          foodPreference: 'Vegetarian',
        }),
      });
      const regAtt2Data = await regAtt2Res.json();
      const httpAttendee2Id = regAtt2Data.attendee.id;

      const regAtt3Res = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
        body: JSON.stringify({
          name: 'Charlie Brown',
          registrationNumber: `REG-103-${ts}`,
          category: 'Student',
          paymentStatus: 'Pending',
        }),
      });
      const regAtt3Data = await regAtt3Res.json();
      const httpAttendee3Id = regAtt3Data.attendee.id;

      assert(
        regAtt2Res.status === 201 && regAtt3Res.status === 201,
        'Registration staff successfully created attendees (201 CREATED)',
        'LEVEL C'
      );

      // TEST C4: Outsider from Org B cannot register attendee in Event A
      const outsiderCreateRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
        body: JSON.stringify({
          name: 'Intruder Attendee',
          registrationNumber: `REG-INTRUDER-${ts}`,
          category: 'Delegate',
        }),
      });
      assert(
        outsiderCreateRes.status === 403,
        'Outsider from unrelated organization is rejected with 403 FORBIDDEN',
        'LEVEL C'
      );

      // TEST C5: List attendees with search filter
      const searchRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees?search=Jane`, {
        headers: { 'Cookie': ownerUser.cookies },
      });
      const searchData = await searchRes.json();
      assert(
        searchRes.status === 200 && searchData.attendees.length === 1 && searchData.attendees[0].name === 'Dr. Jane Smith',
        'Query attendees with search filter correctly isolates matching record',
        'LEVEL C'
      );

      // TEST C6: List attendees with category filter
      const catRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees?category=Delegate`, {
        headers: { 'Cookie': ownerUser.cookies },
      });
      const catData = await catRes.json();
      assert(
        catRes.status === 200 && catData.attendees.length === 1 && catData.attendees[0].name === 'Robert Jones',
        'Query attendees with category filter returns matching attendees',
        'LEVEL C'
      );

      // TEST C7: Pagination metadata
      const pageRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees?pageSize=2&page=1`, {
        headers: { 'Cookie': ownerUser.cookies },
      });
      const pageData = await pageRes.json();
      assert(
        pageRes.status === 200 &&
        pageData.attendees.length === 2 &&
        pageData.pagination.totalCount === 3 &&
        pageData.pagination.totalPages === 2,
        'Pagination correctly limits records and returns accurate pagination metadata',
        'LEVEL C'
      );

      // TEST C8: PII Redaction for Scanner Operator
      const scannerListRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees`, {
        headers: { 'Cookie': scannerUser.cookies },
      });
      const scannerListData = await scannerListRes.json();
      const scannedJane = scannerListData.attendees.find((a) => a.id === httpAttendee1Id);

      assert(
        scannerListRes.status === 200 &&
        scannedJane?.name === 'Dr. Jane Smith' &&
        scannedJane.phoneNumber === null &&
        scannedJane.email === null &&
        scannedJane.medicalCouncilNumber === null,
        'Scanner operator receives attendee records with PII (phone, email, medicalCouncil) strictly redacted',
        'LEVEL C'
      );

      // TEST C9: Scanner operator fetching single attendee receives redacted PII
      const scannerSingleRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee1Id}`, {
        headers: { 'Cookie': scannerUser.cookies },
      });
      const scannerSingleData = await scannerSingleRes.json();
      assert(
        scannerSingleRes.status === 200 &&
        scannerSingleData.attendee.phoneNumber === null &&
        scannerSingleData.attendee.email === null,
        'Single attendee endpoint enforces PII redaction for scanner operator',
        'LEVEL C'
      );

      // TEST C10: Manager fetching single attendee receives full PII
      const managerSingleRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee1Id}`, {
        headers: { 'Cookie': ownerUser.cookies },
      });
      const managerSingleData = await managerSingleRes.json();
      assert(
        managerSingleRes.status === 200 &&
        managerSingleData.attendee.phoneNumber === '+919988776655' &&
        managerSingleData.attendee.email === `jane_${ts}@example.com`,
        'Manager role with event:view_attendee_pii receives unmasked PII',
        'LEVEL C'
      );

      // TEST C11: Registration staff updates attendee details
      const updateRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
        body: JSON.stringify({
          name: 'Dr. Jane W. Smith',
          foodPreference: 'Jain Food',
        }),
      });
      const updateData = await updateRes.json();
      assert(
        updateRes.status === 200 &&
        updateData.attendee.name === 'Dr. Jane W. Smith' &&
        updateData.attendee.foodPreference === 'Jain Food',
        'Registration staff successfully updated attendee details via PATCH (200 OK)',
        'LEVEL C'
      );

      // TEST C12: Scanner operator forbidden from updating attendee
      const scannerUpdateRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': scannerUser.cookies },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      assert(
        scannerUpdateRes.status === 403,
        'Scanner operator updating attendee is rejected with 403 FORBIDDEN',
        'LEVEL C'
      );

      // TEST C13: Registration staff forbidden from deleting attendee
      const regStaffDeleteRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee1Id}`, {
        method: 'DELETE',
        headers: { 'Cookie': regStaffUser.cookies },
      });
      assert(
        regStaffDeleteRes.status === 403,
        'Registration staff deleting attendee is strictly rejected with 403 FORBIDDEN',
        'LEVEL C'
      );

      // TEST C14: Outsider creates Attendee in Event B
      const outsiderAttRes = await fetch(`${APP_URL}/api/events/${outsiderEventId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
        body: JSON.stringify({
          name: 'Foreign Attendee B',
          registrationNumber: `REG-B-${ts}`,
          category: 'Faculty',
        }),
      });
      const outsiderAttData = await outsiderAttRes.json();
      const foreignAttendeeId = outsiderAttData.attendee.id;

      // TEST C15: Bulk deletion with cross-event isolation guarantee
      // Owner of Event A attempts bulk delete containing [Attendee 2 ID, Foreign Attendee ID]
      const bulkDeleteRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify({
          ids: [httpAttendee2Id, foreignAttendeeId],
        }),
      });
      const bulkDeleteData = await bulkDeleteRes.json();

      assert(
        bulkDeleteRes.status === 200 && bulkDeleteData.deletedCount === 1,
        'Bulk delete deleted only the scoped attendee from Event A, ignoring the foreign ID (200 OK)',
        'LEVEL C'
      );

      // Verify foreign attendee in Event B remains untouched
      const verifyForeignRes = await fetch(`${APP_URL}/api/events/${outsiderEventId}/attendees/${foreignAttendeeId}`, {
        headers: { 'Cookie': outsiderUser.cookies },
      });
      assert(
        verifyForeignRes.status === 200,
        'Foreign attendee in Event B remains intact and untouched after cross-event bulk delete attempt',
        'LEVEL C'
      );

      // TEST C16: Owner single delete Attendee 3
      const singleDeleteRes = await fetch(`${APP_URL}/api/events/${httpEventAId}/attendees/${httpAttendee3Id}`, {
        method: 'DELETE',
        headers: { 'Cookie': ownerUser.cookies },
      });
      assert(
        singleDeleteRes.status === 200,
        'Owner successfully deleted attendee via DELETE /attendees/[id] (200 OK)',
        'LEVEL C'
      );

      // TEST C17: Transactional audit log verification
      const audits = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.eventId, httpEventAId));

      const hasCreated = audits.some((a) => a.action === 'attendee:created');
      const hasUpdated = audits.some((a) => a.action === 'attendee:updated');
      const hasBulkDeleted = audits.some((a) => a.action === 'attendees:bulk_deleted');
      const hasDeleted = audits.some((a) => a.action === 'attendee:deleted');

      assert(
        hasCreated && hasUpdated && hasBulkDeleted && hasDeleted,
        'Atomic audit log events verified for creation, update, bulk-delete, and single deletion in database',
        'LEVEL C'
      );

      // Cleanup Level C test data (delete audit_events first due to ON DELETE RESTRICT)
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, httpOrgId));
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, outsiderOrgId));
      await db.delete(organizations).where(eq(organizations.id, httpOrgId));
      await db.delete(organizations).where(eq(organizations.id, outsiderOrgId));
    }
  } finally {
    // Teardown Level A test entities
    await db.delete(organizations).where(eq(organizations.id, testOrgAId));
    await db.delete(organizations).where(eq(organizations.id, testOrgBId));
    console.log('\n✓ Test records cleaned up successfully.');
  }

  console.log('\n================================================================');
  console.log(`STAGE 4 BACKEND TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runStage4BackendTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
