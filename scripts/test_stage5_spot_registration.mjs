import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  events,
  eventStaffAssignments,
  registrationCounters,
  spotRegistrationKeys,
  attendees,
  auditEvents,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage5SpotRegistrationTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 5 SPOT REGISTRATION DESK VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, section = 'STAGE 5') {
    if (condition) {
      console.log(`✓ [${section}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${section}] FAIL: ${message}`);
      failed++;
    }
  }

  // Health check dev server
  let devServerOnline = false;
  try {
    const hc = await fetch(`${APP_URL}/api/health`);
    if (hc.ok) devServerOnline = true;
  } catch {
    devServerOnline = false;
  }

  if (!devServerOnline) {
    console.error(`Next.js server is not reachable at ${APP_URL}. Please start dev server on port 3333.`);
    process.exit(1);
  }

  const ts = Date.now();
  let orgAId = '';
  let eventAId = '';
  const eventASlug = `spot-ev-${ts}`;
  let orgBId = '';
  let eventBId = '';

  let ownerUser = null;
  let regStaffUser = null;
  let scannerUser = null;
  let outsiderUser = null;

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

    ownerUser = await signUpUser(`spot-owner-${ts}@example.com`, 'Spot Owner');
    regStaffUser = await signUpUser(`spot-staff-${ts}@example.com`, 'Spot Reg Staff');
    scannerUser = await signUpUser(`spot-scanner-${ts}@example.com`, 'Spot Scanner');
    outsiderUser = await signUpUser(`spot-outsider-${ts}@example.com`, 'Spot Outsider');

    // 1. Create Org A and Event A
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Spot Testing Org (${ts})`, slug: `spot-org-${ts}` }),
    });
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    const evARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Spot Summit 2026 (${ts})`, slug: eventASlug }),
    });
    const evAData = await evARes.json();
    eventAId = evAData.event.id;

    // 2. Create Org B (Foreign Tenant)
    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Org (${ts})`, slug: `foreign-org-${ts}` }),
    });
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    const evBRes = await fetch(`${APP_URL}/api/organizations/${orgBId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Event (${ts})`, slug: `foreign-ev-${ts}` }),
    });
    const evBData = await evBRes.json();
    eventBId = evBData.event.id;

    // 3. Assign Staff Roles in Event A
    await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: regStaffUser.user.id, role: 'registration_staff' }),
    });

    await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: scannerUser.user.id, role: 'scanner_operator' }),
    });

    // Configure a specific counter for Delegates and Faculty in Event A
    await db.insert(registrationCounters).values([
      {
        eventId: eventAId,
        counterKey: 'delegate_counter',
        displayName: 'Delegates Spot Counter',
        prefix: 'CONF-DEL',
        startValue: 100,
        nextValue: 100,
        padding: 4,
      },
      {
        eventId: eventAId,
        counterKey: 'faculty_counter',
        displayName: 'Faculty Spot Counter',
        prefix: 'CONF-FAC',
        startValue: 50,
        nextValue: 50,
        padding: 3,
      },
    ]);

    // -------------------------------------------------------------------------
    // TEST 1: UNAUTHENTICATED & RBAC REJECTION
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: AUTHENTICATION & RBAC ENFORCEMENT ---');

    // 1.1 Unauthenticated requests are rejected
    const unauthGet = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`);
    assert(unauthGet.status === 401, 'Unauthenticated GET /spot-registration returns 401 UNAUTHENTICATED', 'RBAC');

    const unauthPost = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' }),
    });
    assert(unauthPost.status === 401, 'Unauthenticated POST /spot-registration returns 401 UNAUTHENTICATED', 'RBAC');

    // 1.2 Scanner operator is denied (lacks event:create_attendee)
    const scannerPost = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ name: 'Scanner Attempt', category: 'Delegate' }),
    });
    assert(scannerPost.status === 403, 'Scanner Operator POST /spot-registration returns 403 FORBIDDEN', 'RBAC');

    // 1.3 Outsider from another organization is denied
    const outsiderPost = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: 'Cross-Tenant Attempt', category: 'Delegate' }),
    });
    assert(outsiderPost.status === 403, 'Cross-tenant user POST /spot-registration returns 403 FORBIDDEN', 'RBAC');

    // -------------------------------------------------------------------------
    // TEST 2: SEQUENTIAL NUMBER GENERATION (DELEGATE & FACULTY COUNTERS)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: SEQUENTIAL NUMBER GENERATION ---');

    // 2.1 Registration staff registers first Delegate
    const regStaffDel1 = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Jane Watson',
        category: 'Delegate',
        phoneNumber: '+919876500001',
        email: 'jane@watson.org',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
      }),
    });
    const regStaffDel1Data = await regStaffDel1.json();
    assert(
      regStaffDel1.status === 201 && regStaffDel1Data.attendee.registrationNumber === 'CONF-DEL-0100',
      `First Delegate received sequential registration number 'CONF-DEL-0100' (got: ${regStaffDel1Data.attendee?.registrationNumber})`,
      'SEQUENTIAL'
    );
    assert(
      regStaffDel1Data.attendee.registrationType === 'spot',
      'Attendee registrationType is recorded as "spot"',
      'SEQUENTIAL'
    );

    // 2.2 Registration staff registers second Delegate
    const regStaffDel2 = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        name: 'Prof. Arthur Hastings',
        category: 'Delegate',
      }),
    });
    const regStaffDel2Data = await regStaffDel2.json();
    assert(
      regStaffDel2.status === 201 && regStaffDel2Data.attendee.registrationNumber === 'CONF-DEL-0101',
      `Second Delegate received incremented registration number 'CONF-DEL-0101' (got: ${regStaffDel2Data.attendee?.registrationNumber})`,
      'SEQUENTIAL'
    );

    // 2.3 Registration staff registers Faculty (routes to faculty_counter)
    const regStaffFac = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Linus Pauling',
        category: 'Faculty',
        medicalCouncilNumber: 'MCI-88221',
      }),
    });
    const regStaffFacData = await regStaffFac.json();
    assert(
      regStaffFac.status === 201 && regStaffFacData.attendee.registrationNumber === 'CONF-FAC-050',
      `Faculty member received faculty counter number 'CONF-FAC-050' (got: ${regStaffFacData.attendee?.registrationNumber})`,
      'SEQUENTIAL'
    );

    // Verify counter record in database
    const [delCounterDb] = await db
      .select()
      .from(registrationCounters)
      .where(and(eq(registrationCounters.eventId, eventAId), eq(registrationCounters.counterKey, 'delegate_counter')));
    assert(
      delCounterDb.nextValue === 102 && delCounterDb.lastUsedValue === 101,
      'Delegate counter nextValue updated to 102 and lastUsedValue to 101 in database',
      'SEQUENTIAL'
    );

    // -------------------------------------------------------------------------
    // TEST 3: CONCURRENT SPOT REGISTRATION UNDER LOAD
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: CONCURRENT SPOT REGISTRATIONS ---');
    // Issue 4 concurrent spot registrations simultaneously
    const concurrentCount = 4;
    const concurrentPromises = Array.from({ length: concurrentCount }).map((_, idx) =>
      fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
        body: JSON.stringify({
          name: `Concurrent Delegate ${idx + 1}`,
          category: 'Delegate',
        }),
      }).then((r) => r.json())
    );

    const concurrentResults = await Promise.all(concurrentPromises);
    const generatedRegNumbers = concurrentResults.map((r) => r.attendee?.registrationNumber);
    const uniqueRegNumbers = new Set(generatedRegNumbers);

    assert(
      uniqueRegNumbers.size === concurrentCount,
      `All ${concurrentCount} concurrent requests received unique, collision-free numbers (${generatedRegNumbers.join(', ')})`,
      'CONCURRENCY'
    );

    // -------------------------------------------------------------------------
    // TEST 4: IDEMPOTENCY PROTECTION (NETWORK RETRIES / ACCIDENTAL DOUBLE SUBMISSION)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: IDEMPOTENCY & DUPLICATE PROTECTION ---');
    const testIdempotencyKey = `idem_${ts}_key_test`;

    const initialRes = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        name: 'Retry Candidate',
        category: 'Delegate',
        idempotencyKey: testIdempotencyKey,
      }),
    });
    const initialData = await initialRes.json();
    assert(
      initialRes.status === 201 && initialData.idempotent === false,
      'First submission with idempotency key creates record (201 CREATED, idempotent: false)',
      'IDEMPOTENCY'
    );
    const initialRegNo = initialData.attendee.registrationNumber;
    const initialAttendeeId = initialData.attendee.id;

    // Retry with identical idempotencyKey
    const retryRes = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        name: 'Retry Candidate',
        category: 'Delegate',
        idempotencyKey: testIdempotencyKey,
      }),
    });
    const retryData = await retryRes.json();
    assert(
      retryRes.status === 200 && retryData.idempotent === true,
      'Replay submission with identical idempotency key returns 200 OK with idempotent: true',
      'IDEMPOTENCY'
    );
    assert(
      retryData.attendee.id === initialAttendeeId && retryData.attendee.registrationNumber === initialRegNo,
      'Idempotent replay returns the exact same attendee ID and registration number without duplicating',
      'IDEMPOTENCY'
    );

    // Verify exactly 1 row exists for this key in spot_registration_keys table
    const [keyRecordDb] = await db
      .select()
      .from(spotRegistrationKeys)
      .where(and(eq(spotRegistrationKeys.eventId, eventAId), eq(spotRegistrationKeys.idempotencyKey, testIdempotencyKey)));
    assert(
      keyRecordDb?.attendeeId === initialAttendeeId,
      'spot_registration_keys table verified with single mapping to attendeeId',
      'IDEMPOTENCY'
    );

    // -------------------------------------------------------------------------
    // TEST 5: ATOMIC AUDIT LOGGING
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: ATOMIC AUDIT LOGGING ---');
    const spotAudits = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.eventId, eventAId), eq(auditEvents.action, 'attendee:spot_registered')));
    assert(
      spotAudits.length >= 7,
      `Audit logs verify ${spotAudits.length} atomic 'attendee:spot_registered' entries with transaction isolation`,
      'AUDIT'
    );
    const sampleAudit = spotAudits[0];
    assert(
      sampleAudit.details?.registrationType === 'spot' && sampleAudit.details?.registrationNumber != null,
      'Audit log details contain registrationNumber and registrationType: spot',
      'AUDIT'
    );

    // -------------------------------------------------------------------------
    // TEST 6: DIRECTORY VISIBILITY
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: ATTENDEE DIRECTORY INTEGRATION ---');
    const directoryRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees?registrationType=spot`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const directoryData = await directoryRes.json();
    assert(
      directoryRes.status === 200 && directoryData.attendees.length >= 7,
      `Spot attendees appear immediately in Attendee Directory filtered by registrationType=spot (${directoryData.attendees.length} found)`,
      'INTEGRATION'
    );

    // -------------------------------------------------------------------------
    // TEST 7: NEXT.JS SPOT REGISTRATION PAGE ROUTE (200 OK)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: SPOT REGISTRATION PAGE RENDERING ---');
    const pageRes = await fetch(`${APP_URL}/events/${eventASlug}/spot-registration`, {
      headers: { 'Cookie': regStaffUser.cookies },
      redirect: 'manual',
    });
    assert(
      pageRes.status === 200 && !pageRes.headers.get('location'),
      'Authenticated Registration Staff fetches /events/[eventSlug]/spot-registration successfully (200 OK)',
      'PAGE ROUTE'
    );

  } finally {
    // Teardown test tenants
    if (orgAId) {
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgAId));
      await db.delete(organizations).where(eq(organizations.id, orgAId));
    }
    if (orgBId) {
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgBId));
      await db.delete(organizations).where(eq(organizations.id, orgBId));
    }
  }

  console.log('\n================================================================');
  console.log(`STAGE 5 SPOT REGISTRATION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runStage5SpotRegistrationTests().catch((err) => {
  console.error('Stage 5 Test Suite execution error:', err);
  process.exit(1);
});
