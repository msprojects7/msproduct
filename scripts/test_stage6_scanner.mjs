import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  registrationCounters,
  attendees,
  scanEvents,
  auditEvents,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage6ScannerTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 6 QR SCANNER & ATTENDANCE VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, section = 'STAGE 6') {
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
  const eventASlug = `scan-ev-${ts}`;
  let orgBId = '';
  let eventBId = '';

  let ownerUser = null;
  let orgMemberUser = null;
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

    ownerUser = await signUpUser(`scan-owner-${ts}@example.com`, 'Scanner Owner');
    orgMemberUser = await signUpUser(`scan-member-${ts}@example.com`, 'Org Member');
    scannerUser = await signUpUser(`scan-operator-${ts}@example.com`, 'Scanner Operator');
    outsiderUser = await signUpUser(`scan-outsider-${ts}@example.com`, 'Foreign Outsider');

    // 1. Create Org A and Event A
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Scan Test Org (${ts})`, slug: `scan-org-${ts}` }),
    });
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    const evARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Scan Expo 2026 (${ts})`, slug: eventASlug }),
    });
    const evAData = await evARes.json();
    eventAId = evAData.event.id;

    // 2. Add orgMemberUser as regular org_member (no event:scan_badge permission)
    await db.insert(organizationMembers).values({
      organizationId: orgAId,
      userId: orgMemberUser.user.id,
      role: 'member',
      isActive: true,
    });

    // 3. Create Foreign Org B & Event B
    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Scan Org (${ts})`, slug: `foreign-scan-org-${ts}` }),
    });
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    const evBRes = await fetch(`${APP_URL}/api/organizations/${orgBId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Event B (${ts})`, slug: `foreign-scan-ev-${ts}` }),
    });
    const evBData = await evBRes.json();
    eventBId = evBData.event.id;

    // 4. Assign scannerUser as scanner_operator in Event A
    await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: scannerUser.user.id, role: 'scanner_operator' }),
    });

    // 5. Create Pre-Registered Attendee 1 in Event A
    const att1Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Evelyn Reed',
        registrationNumber: `CONF-SCAN-01`,
        category: 'Delegate',
        paymentStatus: 'Paid',
      }),
    });
    const att1Data = await att1Res.json();
    const attendee1 = att1Data.attendee;

    // 6. Create Pre-Registered Attendee 2 in Event A (for checkout test)
    const att2Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Prof. Marcus Vance',
        registrationNumber: `CONF-SCAN-02`,
        category: 'Faculty',
        paymentStatus: 'Paid',
      }),
    });
    const att2Data = await att2Res.json();
    const attendee2 = att2Data.attendee;

    // 7. Create Spot Attendee 3 in Event A (via Stage 5 spot registration)
    const spotRes = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Sarah Connor',
        category: 'Delegate',
        foodPreference: 'Vegetarian',
        idempotencyKey: `spot-key-scan-${ts}`,
      }),
    });
    const spotData = await spotRes.json();
    const spotAttendee = spotData.attendee;

    // 8. Create Foreign Attendee in Event B
    const attForeignRes = await fetch(`${APP_URL}/api/events/${eventBId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({
        name: 'Foreign Delegate',
        registrationNumber: `FOREIGN-001`,
        category: 'Delegate',
      }),
    });
    const attForeignData = await attForeignRes.json();
    const foreignAttendee = attForeignData.attendee;

    // =========================================================================
    // TEST 1: AUTHENTICATION & CENTRALIZED RBAC ENFORCEMENT
    // =========================================================================
    console.log('--- TEST 1: AUTHENTICATION & RBAC ENFORCEMENT ---');

    // 1.1 Unauthenticated GET
    const unauthGetRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`);
    assert(unauthGetRes.status === 401, 'Unauthenticated GET /scan returns 401 UNAUTHENTICATED', 'RBAC');

    // 1.2 Unauthenticated POST
    const unauthPostRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: attendee1.qrToken, action: 'check_in' }),
    });
    assert(unauthPostRes.status === 401, 'Unauthenticated POST /scan returns 401 UNAUTHENTICATED', 'RBAC');

    // 1.3 Regular org_member lacking event:scan_badge receives 403
    const memberPostRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': orgMemberUser.cookies },
      body: JSON.stringify({ qrToken: attendee1.qrToken, action: 'check_in' }),
    });
    assert(memberPostRes.status === 403, 'Regular org_member without event:scan_badge returns 403 FORBIDDEN', 'RBAC');

    // 1.4 Cross-tenant user from Org B receives 403
    const outsiderPostRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ qrToken: attendee1.qrToken, action: 'check_in' }),
    });
    assert(outsiderPostRes.status === 403, 'Cross-tenant user from another organization returns 403 FORBIDDEN', 'RBAC');

    // 1.5 Assigned scanner_operator accesses GET /scan successfully
    const operatorGetRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      headers: { 'Cookie': scannerUser.cookies },
    });
    const operatorGetData = await operatorGetRes.json();
    assert(
      operatorGetRes.status === 200 && operatorGetData.stats?.totalAttendees >= 3,
      'Assigned scanner_operator successfully fetches /scan stats (200 OK)',
      'RBAC'
    );

    // =========================================================================
    // TEST 2: CHECK-IN BUSINESS RULES & STATUS TRANSITIONS
    // =========================================================================
    console.log('\n--- TEST 2: CHECK-IN BUSINESS RULES ---');

    // 2.1 Check in not_checked_in attendee by qrToken
    const checkIn1Res = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee1.qrToken, action: 'check_in' }),
    });
    const checkIn1Data = await checkIn1Res.json();
    assert(
      checkIn1Res.status === 200 &&
      checkIn1Data.success === true &&
      checkIn1Data.result === 'success_check_in' &&
      checkIn1Data.attendee?.attendanceStatus === 'checked_in',
      `Check-in fresh attendee succeeds with 'success_check_in' (got: ${checkIn1Data.result})`,
      'CHECK-IN'
    );

    // 2.2 Verify status in DB
    const [dbAtt1] = await db.select().from(attendees).where(eq(attendees.id, attendee1.id));
    assert(dbAtt1.attendanceStatus === 'checked_in', 'Database confirms attendanceStatus is now "checked_in"', 'CHECK-IN');

    // 2.3 Re-scan already checked in attendee
    const checkInReplayRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee1.qrToken, action: 'check_in' }),
    });
    const checkInReplayData = await checkInReplayRes.json();
    assert(
      checkInReplayRes.status === 200 &&
      checkInReplayData.success === true &&
      checkInReplayData.result === 'already_checked_in',
      `Repeated check-in returns 'already_checked_in' without error (got: ${checkInReplayData.result})`,
      'CHECK-IN'
    );

    // 2.4 Verify no duplicate scan_events created
    const att1Scans = await db.select().from(scanEvents).where(eq(scanEvents.attendeeId, attendee1.id));
    assert(att1Scans.length === 1, `Exactly 1 scan_events row created for attendee 1 after replay (count: ${att1Scans.length})`, 'CHECK-IN');

    // =========================================================================
    // TEST 3: CHECK-OUT BUSINESS RULES
    // =========================================================================
    console.log('\n--- TEST 3: CHECK-OUT BUSINESS RULES ---');

    // 3.1 Check out attendee 2 who is NOT checked in yet
    const checkoutNotRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee2.qrToken, action: 'check_out' }),
    });
    const checkoutNotData = await checkoutNotRes.json();
    assert(
      checkoutNotRes.status === 200 &&
      checkoutNotData.result === 'not_checked_in',
      `Checking out an un-checked-in attendee returns 'not_checked_in' (got: ${checkoutNotData.result})`,
      'CHECK-OUT'
    );

    // 3.2 First check in attendee 2
    await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee2.qrToken, action: 'check_in' }),
    });

    // 3.3 Now check out attendee 2
    const checkoutSuccessRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee2.qrToken, action: 'check_out' }),
    });
    const checkoutSuccessData = await checkoutSuccessRes.json();
    assert(
      checkoutSuccessRes.status === 200 &&
      checkoutSuccessData.result === 'success_check_out' &&
      checkoutSuccessData.attendee?.attendanceStatus === 'checked_out',
      `Check-out of checked-in attendee returns 'success_check_out' (got: ${checkoutSuccessData.result})`,
      'CHECK-OUT'
    );

    // 3.4 Verify status in DB
    const [dbAtt2] = await db.select().from(attendees).where(eq(attendees.id, attendee2.id));
    assert(dbAtt2.attendanceStatus === 'checked_out', 'Database confirms attendanceStatus is now "checked_out"', 'CHECK-OUT');

    // 3.5 Re-scan already checked out attendee
    const checkoutReplayRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: attendee2.qrToken, action: 'check_out' }),
    });
    const checkoutReplayData = await checkoutReplayRes.json();
    assert(
      checkoutReplayRes.status === 200 &&
      checkoutReplayData.result === 'already_checked_out',
      `Repeated check-out returns 'already_checked_out' (got: ${checkoutReplayData.result})`,
      'CHECK-OUT'
    );

    // =========================================================================
    // TEST 4: CROSS-EVENT ISOLATION
    // =========================================================================
    console.log('\n--- TEST 4: CROSS-EVENT ISOLATION ---');

    // Attempting to scan foreign attendee from Event B inside Event A
    const crossEventRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: foreignAttendee.qrToken, action: 'check_in' }),
    });
    const crossEventData = await crossEventRes.json();
    assert(
      crossEventData.result === 'invalid_qr' && crossEventData.success === false,
      `Scanning foreign event attendee in Event A is rejected as 'invalid_qr' (got: ${crossEventData.result})`,
      'ISOLATION'
    );

    // =========================================================================
    // TEST 5: MANUAL LOOKUP & REGISTRATION NUMBER CHECK-IN
    // =========================================================================
    console.log('\n--- TEST 5: MANUAL LOOKUP & CHECK-IN ---');

    // 5.1 Lookup by search query
    const searchRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan?search=${encodeURIComponent('CONF-SCAN-01')}`, {
      headers: { 'Cookie': scannerUser.cookies },
    });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
      searchData.attendees?.length === 1 &&
      searchData.attendees[0]?.name === 'Dr. Evelyn Reed',
      'Search lookup by registration number successfully locates attendee record',
      'MANUAL'
    );

    // 5.2 Direct check-in using registrationNumber payload
    // Create new attendee to test registrationNumber check-in
    const att3Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        registrationNumber: `CONF-SCAN-03`,
        category: 'Faculty',
      }),
    });
    const att3Data = await att3Res.json();

    const manualCheckInRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ registrationNumber: 'CONF-SCAN-03', action: 'check_in' }),
    });
    const manualCheckInData = await manualCheckInRes.json();
    assert(
      manualCheckInRes.status === 200 &&
      manualCheckInData.result === 'success_check_in' &&
      manualCheckInData.attendee?.registrationNumber === 'CONF-SCAN-03',
      'Direct check-in by registrationNumber succeeds (result: success_check_in)',
      'MANUAL'
    );

    // =========================================================================
    // TEST 6: CONCURRENT SCAN SAFETY
    // =========================================================================
    console.log('\n--- TEST 6: CONCURRENT SCAN SAFETY ---');

    // Create attendee 4 for concurrent stress test
    const att4Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Dr. Bruce Banner',
        registrationNumber: `CONF-SCAN-04`,
        category: 'Delegate',
      }),
    });
    const att4Data = await att4Res.json();
    const attendee4 = att4Data.attendee;

    // Fire 4 simultaneous check-in requests on the same attendee
    const concurrentRequests = Array.from({ length: 4 }, () =>
      fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
        body: JSON.stringify({ qrToken: attendee4.qrToken, action: 'check_in' }),
      }).then((r) => r.json())
    );

    const concurrentResults = await Promise.all(concurrentRequests);
    const successCount = concurrentResults.filter((r) => r.result === 'success_check_in').length;
    const alreadyCount = concurrentResults.filter((r) => r.result === 'already_checked_in').length;

    assert(
      successCount === 1 && alreadyCount === 3,
      `4 concurrent scans serialized safely: exactly 1 success_check_in and 3 already_checked_in (got ${successCount} success, ${alreadyCount} already)`,
      'CONCURRENCY'
    );

    // =========================================================================
    // TEST 7: STAGE 5 SPOT REGISTRATION INTEGRATION & AUDIT LOGS
    // =========================================================================
    console.log('\n--- TEST 7: SPOT REGISTRATION INTEGRATION & ATOMIC AUDIT LOGS ---');

    // 7.1 Check in Stage 5 spot attendee
    const spotCheckInRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ qrToken: spotAttendee.qrToken, action: 'check_in' }),
    });
    const spotCheckInData = await spotCheckInRes.json();
    assert(
      spotCheckInRes.status === 200 &&
      spotCheckInData.result === 'success_check_in' &&
      spotCheckInData.attendee?.name === 'Dr. Sarah Connor',
      'Stage 5 spot-registered attendee successfully checked in by scanner operator',
      'INTEGRATION'
    );

    // 7.2 Database verification of scan_events entries
    const allScansInEvent = await db
      .select()
      .from(scanEvents)
      .where(eq(scanEvents.eventId, eventAId));
    assert(
      allScansInEvent.length >= 5,
      `Database confirms ${allScansInEvent.length} scan_events recorded with staffUserId and eventId`,
      'AUDIT'
    );

    // 7.3 Database verification of audit_events entries
    const checkInAudits = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.eventId, eventAId),
          eq(auditEvents.action, 'attendee:checked_in')
        )
      );
    const checkOutAudits = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.eventId, eventAId),
          eq(auditEvents.action, 'attendee:checked_out')
        )
      );

    assert(
      checkInAudits.length >= 4,
      `Database confirms ${checkInAudits.length} 'attendee:checked_in' audit entries recorded`,
      'AUDIT'
    );
    assert(
      checkOutAudits.length >= 1,
      `Database confirms ${checkOutAudits.length} 'attendee:checked_out' audit entries recorded`,
      'AUDIT'
    );

    // =========================================================================
    // TEST 8: FRONTEND PAGE RENDERING
    // =========================================================================
    console.log('\n--- TEST 8: SCANNER DESK PAGE ROUTE RENDERING ---');

    const pageRes = await fetch(`${APP_URL}/events/${eventASlug}/scanner`, {
      headers: { 'Cookie': scannerUser.cookies },
      redirect: 'manual',
    });
    assert(
      pageRes.status === 200 && !pageRes.headers.get('location'),
      'Authenticated scanner operator fetches /events/[eventSlug]/scanner successfully (HTTP 200 OK)',
      'PAGE ROUTE'
    );

  } catch (err) {
    console.error('Unexpected test error occurred:', err);
    assert(false, `Test execution failed with error: ${err.message}`, 'EXCEPTION');
  } finally {
    // Clean up test data
    console.log('\nCleaning up Stage 6 test data...');
    try {
      if (orgAId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgAId));
        await db.delete(organizations).where(eq(organizations.id, orgAId));
      }
      if (orgBId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgBId));
        await db.delete(organizations).where(eq(organizations.id, orgBId));
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`STAGE 6 SCANNER TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage6ScannerTests();
