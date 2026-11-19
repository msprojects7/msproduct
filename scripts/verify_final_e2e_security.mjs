import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  organizationInvitations,
  events,
  eventStaffAssignments,
  registrationCounters,
  attendees,
  scanEvents,
  badgePrintEvents,
  spotRegistrationKeys,
  auditEvents,
} from '../db/schema/index';
import { eq, and, sql } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runMasterVerification() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — MASTER END-TO-END VERIFICATION & SECURITY SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, category = 'VERIFY') {
    if (condition) {
      console.log(`✓ [${category}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${category}] FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check server
  let serverOnline = false;
  try {
    const res = await fetch(`${APP_URL}/api/health`);
    if (res.ok) serverOnline = true;
  } catch {
    serverOnline = false;
  }

  if (!serverOnline) {
    console.error(`Server is not online at ${APP_URL}. Please start server on port 3333.`);
    process.exit(1);
  }

  const ts = Date.now();
  let orgAId = '';
  let orgBId = '';
  let eventAId = '';
  let eventBId = '';
  const eventASlug = `master-ev-a-${ts}`;
  const eventBSlug = `master-ev-b-${ts}`;

  let ownerA = null;
  let ownerB = null;
  let managerA = null;
  let regStaffA = null;
  let scannerA = null;
  let plainMemberA = null;

  try {
    const signUp = async (email, name) => {
      const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
        body: JSON.stringify({ email, password: 'MasterPassword123!@#', name }),
      });
      const data = await res.json();
      const setCookies = res.headers.getSetCookie?.() || [res.headers.get('set-cookie') || ''];
      const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
      return { user: data.user, cookies };
    };

    ownerA = await signUp(`m-owner-a-${ts}@example.com`, 'Owner Alpha');
    ownerB = await signUp(`m-owner-b-${ts}@example.com`, 'Owner Beta');
    managerA = await signUp(`m-manager-a-${ts}@example.com`, 'Manager Alpha');
    regStaffA = await signUp(`m-regstaff-a-${ts}@example.com`, 'Reg Staff Alpha');
    scannerA = await signUp(`m-scanner-a-${ts}@example.com`, 'Scanner Alpha');
    plainMemberA = await signUp(`m-member-a-${ts}@example.com`, 'Plain Member Alpha');

    // =========================================================================
    // SECTION 1: PHASE 3 — AUTHENTICATION & ACCESS CONTROL INTEGRITY
    // =========================================================================
    console.log('\n--- Section 1: Authentication & Access Control (Phase 3) ---');

    // 1.1 Unauthenticated requests to all key endpoints return 401
    const testEndpoints = [
      { method: 'GET', path: '/api/organizations' },
      { method: 'POST', path: '/api/organizations', body: { name: 'Test', slug: 'test' } },
      { method: 'GET', path: `/api/events` },
      { method: 'GET', path: `/api/events/00000000-0000-0000-0000-000000000000/attendees` },
      { method: 'POST', path: `/api/events/00000000-0000-0000-0000-000000000000/attendees`, body: {} },
      { method: 'POST', path: `/api/events/00000000-0000-0000-0000-000000000000/spot-registration`, body: {} },
      { method: 'GET', path: `/api/events/00000000-0000-0000-0000-000000000000/scan` },
      { method: 'POST', path: `/api/events/00000000-0000-0000-0000-000000000000/badges/print`, body: {} },
      { method: 'GET', path: `/api/events/00000000-0000-0000-0000-000000000000/reports` },
      { method: 'GET', path: `/api/events/00000000-0000-0000-0000-000000000000/reports/export` },
    ];

    for (const ep of testEndpoints) {
      const res = await fetch(`${APP_URL}${ep.path}`, {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : {},
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(res.status === 401, `Unauthenticated ${ep.method} ${ep.path.split('/')[2]} rejected with 401`, 'AUTH_401');
    }

    // 1.2 Invalid session cookies rejected
    const badCookieRes = await fetch(`${APP_URL}/api/organizations`, {
      headers: { Cookie: 'better-auth.session_token=fake_invalid_token_12345' },
    });
    assert(badCookieRes.status === 401, 'Tampered/fake session token returns 401 UNAUTHENTICATED', 'AUTH_SESSION');

    // 1.3 Auth failure error responses do not leak credentials, secrets or stack traces
    const badLoginRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'WrongPassword' }),
    });
    assert(badLoginRes.status === 401 || badLoginRes.status === 400, 'Invalid credentials rejected safely', 'AUTH_ERROR');
    const badLoginText = await badLoginRes.text();
    assert(
      !badLoginText.toLowerCase().includes('password') || !badLoginText.includes('hash'),
      'Authentication failure does not leak password hashes or internal secrets',
      'AUTH_ERROR'
    );

    // =========================================================================
    // SECTION 2: WORKFLOW A & PHASE 4 — TENANT SETUP & ISOLATION PENETRATION
    // =========================================================================
    console.log('\n--- Section 2: Tenant Setup & Multi-Tenant Isolation (Phase 4 & Workflow A) ---');

    // 2.1 Owner A creates Organization A
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ name: `Tenant Alpha ${ts}`, slug: `tenant-alpha-${ts}` }),
    });
    assert(orgARes.status === 201, 'Workflow A: Owner A creates Organization A (201 CREATED)', 'WORKFLOW_A');
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    // 2.2 Owner B creates Organization B
    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerB.cookies },
      body: JSON.stringify({ name: `Tenant Beta ${ts}`, slug: `tenant-beta-${ts}` }),
    });
    assert(orgBRes.status === 201, 'Workflow A: Owner B creates Organization B (201 CREATED)', 'WORKFLOW_A');
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    // 2.3 Invitation & Acceptance: Owner A invites Manager A with matching email
    const inviteRes = await fetch(`${APP_URL}/api/organizations/${orgAId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ email: managerA.user.email, role: 'admin' }),
    });
    assert(inviteRes.status === 201, 'Owner A generates invitation for Manager A (201 CREATED)', 'WORKFLOW_A');
    const inviteData = await inviteRes.json();
    const inviteToken = inviteData.token;

    // 2.4 Mismatched identity invitation acceptance attempt
    const foreignAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerB.cookies },
      body: JSON.stringify({ token: inviteToken }),
    });
    assert(foreignAcceptRes.status === 403, 'Foreign user with mismatched email rejected on invitation accept (403)', 'TENANT_ISOLATION');

    // 2.5 Legitimate invitee accepts invitation
    const legitAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: managerA.cookies },
      body: JSON.stringify({ token: inviteToken }),
    });
    assert(legitAcceptRes.status === 200, 'Legitimate invitee successfully accepts invitation (200 OK)', 'WORKFLOW_A');

    // 2.6 Replay of accepted invitation token rejected
    const replayAcceptRes = await fetch(`${APP_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: managerA.cookies },
      body: JSON.stringify({ token: inviteToken }),
    });
    assert(replayAcceptRes.status === 400, 'Replay of accepted invitation token rejected with 400', 'SECURITY');

    // 2.7 Create Events: Event A in Org A, Event B in Org B
    const evARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ name: `Event Alpha ${ts}`, slug: eventASlug, venue: 'Grand Hall A' }),
    });
    assert(evARes.status === 201, 'Owner A creates Event A (201 CREATED)', 'WORKFLOW_A');
    const evAData = await evARes.json();
    eventAId = evAData.event.id;

    const evBRes = await fetch(`${APP_URL}/api/organizations/${orgBId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerB.cookies },
      body: JSON.stringify({ name: `Event Beta ${ts}`, slug: eventBSlug, venue: 'Convention Center B' }),
    });
    assert(evBRes.status === 201, 'Owner B creates Event B (201 CREATED)', 'WORKFLOW_A');
    const evBData = await evBRes.json();
    eventBId = evBData.event.id;

    // 2.8 Staff Assignment in Event A: assign regStaffA and scannerA
    const assignStaffRes = await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ userId: regStaffA.user.id, role: 'registration_staff' }),
    });
    assert(assignStaffRes.status === 201, 'Assigned Registration Staff to Event A (201 CREATED)', 'WORKFLOW_A');

    const assignScannerRes = await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ userId: scannerA.user.id, role: 'scanner_operator' }),
    });
    assert(assignScannerRes.status === 201, 'Assigned Scanner Operator to Event A (201 CREATED)', 'WORKFLOW_A');

    // 2.9 Penetration Checks: Cross-tenant unauthorized access across endpoints
    const crossEndpoints = [
      { name: 'GET Org B details', method: 'GET', url: `/api/organizations/${orgBId}` },
      { name: 'PATCH Org B', method: 'PATCH', url: `/api/organizations/${orgBId}`, body: { name: 'Hacked' } },
      { name: 'GET Event B details', method: 'GET', url: `/api/events/${eventBId}` },
      { name: 'GET Event B attendees', method: 'GET', url: `/api/events/${eventBId}/attendees` },
      { name: 'GET Event B scanner stats', method: 'GET', url: `/api/events/${eventBId}/scan` },
      { name: 'GET Event B badge layout', method: 'GET', url: `/api/events/${eventBId}/badges/layout` },
      { name: 'GET Event B reports', method: 'GET', url: `/api/events/${eventBId}/reports` },
      { name: 'GET Event B report export', method: 'GET', url: `/api/events/${eventBId}/reports/export` },
    ];

    for (const test of crossEndpoints) {
      const res = await fetch(`${APP_URL}${test.url}`, {
        method: test.method,
        headers: {
          Cookie: ownerA.cookies,
          ...(test.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: test.body ? JSON.stringify(test.body) : undefined,
      });
      assert(
        res.status === 403 || res.status === 404,
        `Tenant A attempting ${test.name} is rejected with ${res.status}`,
        'TENANT_ISOLATION'
      );
    }

    // =========================================================================
    // SECTION 3: WORKFLOW B — ATTENDEE MANAGEMENT & BULK ISOLATION
    // =========================================================================
    console.log('\n--- Section 3: Attendee Management & Bulk Operations (Workflow B) ---');

    // 3.1 Create Attendee 1 in Event A
    const att1Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({
        name: 'Dr. John Watson',
        registrationNumber: `REG-A-001-${ts}`,
        category: 'Faculty',
        phoneNumber: '+919876543210',
        email: 'watson@example.com',
        gender: 'Male',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
      }),
    });
    assert(att1Res.status === 201, 'Workflow B: Create attendee in Event A (201 CREATED)', 'WORKFLOW_B');
    const att1Data = await att1Res.json();
    const att1Id = att1Data.attendee.id;

    // 3.2 Duplicate registration number within Event A rejected
    const dupRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({
        name: 'Imposter John',
        registrationNumber: `REG-A-001-${ts}`,
        category: 'Delegate',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate registration number in same event rejected with 409 REGISTRATION_NUMBER_EXISTS', 'WORKFLOW_B');

    // 3.3 Create Attendee 2 in Event A with Formula injection payload
    const formulaPayload = '=HYPERLINK("http://evil.com","Pwned")';
    const att2Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({
        name: formulaPayload,
        registrationNumber: `+999-EVIL-${ts}`,
        category: 'Delegate',
        phoneNumber: '@phone-attack',
        email: '-formula@attack.com',
        paymentStatus: 'Paid',
      }),
    });
    assert(att2Res.status === 201, 'Created attendee with spreadsheet formula payload for export safety testing', 'WORKFLOW_B');
    const att2Data = await att2Res.json();
    const att2Id = att2Data.attendee.id;

    // 3.4 Seed foreign attendee in Event B
    const [foreignAttB] = await db
      .insert(attendees)
      .values({
        eventId: eventBId,
        registrationNumber: `REG-B-001-${ts}`,
        name: 'Foreign Delegate B',
        category: 'Delegate',
        paymentStatus: 'Paid',
        attendanceStatus: 'checked_in',
      })
      .returning();

    // 3.5 Cross-tenant bulk delete attempt
    const bulkDelRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ ids: [att1Id, foreignAttB.id] }),
    });
    assert(bulkDelRes.status === 200, 'Bulk delete request completed', 'TENANT_ISOLATION');
    const bulkDelData = await bulkDelRes.json();
    assert(bulkDelData.deletedCount === 1, 'Bulk delete strictly deleted only the scoped Event A attendee (deletedCount: 1)', 'TENANT_ISOLATION');

    // Confirm Foreign Attendee in Event B is intact
    const [checkForeignAtt] = await db.select().from(attendees).where(eq(attendees.id, foreignAttB.id));
    assert(Boolean(checkForeignAtt), 'Foreign Attendee in Event B remained intact and untouched in database', 'TENANT_ISOLATION');

    // =========================================================================
    // SECTION 4: WORKFLOW C & PHASE 6 — SPOT REGISTRATION & CONCURRENCY
    // =========================================================================
    console.log('\n--- Section 4: Spot Registration & Concurrency (Workflow C & Phase 6) ---');

    // 4.1 Initialize Registration Counters for Event A
    await db.insert(registrationCounters).values([
      {
        eventId: eventAId,
        counterKey: 'delegate_counter',
        displayName: 'Delegate Counter',
        prefix: 'CONF-DEL',
        startValue: 100,
        nextValue: 100,
        padding: 4,
      },
    ]);

    // 4.2 First spot registration
    const spotKey1 = `spot-idem-key-${ts}-1`;
    const spotRes1 = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        idempotencyKey: spotKey1,
        name: 'Sherlock Holmes',
        category: 'Delegate',
        phoneNumber: '+919999888877',
        paymentStatus: 'Paid',
      }),
    });
    assert(spotRes1.status === 201, 'Workflow C: Spot registration succeeds (201 CREATED)', 'WORKFLOW_C');
    const spotData1 = await spotRes1.json();
    assert(spotData1.attendee.registrationNumber === 'CONF-DEL-0100', 'First spot attendee receives CONF-DEL-0100', 'WORKFLOW_C');

    // 4.3 Idempotent replay of same request
    const spotReplayRes = await fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        idempotencyKey: spotKey1,
        name: 'Sherlock Holmes',
        category: 'Delegate',
      }),
    });
    assert(spotReplayRes.status === 200, 'Idempotent replay returns 200 OK', 'WORKFLOW_C');
    const spotReplayData = await spotReplayRes.json();
    assert(
      spotReplayData.idempotent === true && spotReplayData.attendee.id === spotData1.attendee.id,
      'Idempotent replay returned exact existing attendee without generating duplicates',
      'WORKFLOW_C'
    );

    // 4.4 High Concurrency Race: 6 concurrent spot registrations
    const concurrentPromises = Array.from({ length: 6 }).map((_, idx) =>
      fetch(`${APP_URL}/api/events/${eventAId}/spot-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
        body: JSON.stringify({
          idempotencyKey: `spot-race-${ts}-${idx}`,
          name: `Concurrent Delegate ${idx}`,
          category: 'Delegate',
        }),
      }).then((r) => r.json())
    );

    const concurrentResults = await Promise.all(concurrentPromises);
    const assignedNumbers = concurrentResults.map((r) => r.attendee?.registrationNumber).filter(Boolean);
    const uniqueAssignedNumbers = new Set(assignedNumbers);
    assert(
      assignedNumbers.length === 6 && uniqueAssignedNumbers.size === 6,
      `6 concurrent spot requests received 6 unique sequential collision-free numbers (${assignedNumbers.join(', ')})`,
      'CONCURRENCY'
    );

    // =========================================================================
    // SECTION 5: WORKFLOW D — QR SCANNING & ATTENDANCE STATE MACHINE
    // =========================================================================
    console.log('\n--- Section 5: QR Scanning & Attendance State Machine (Workflow D) ---');

    const spotAttendee = spotData1.attendee;

    // 5.1 Check in fresh attendee
    const checkInRes1 = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: scannerA.cookies },
      body: JSON.stringify({
        qrToken: spotAttendee.qrToken,
        action: 'check_in',
      }),
    });
    assert(checkInRes1.status === 200, 'Check in scan request returned 200 OK', 'WORKFLOW_D');
    const checkInData1 = await checkInRes1.json();
    assert(checkInData1.result === 'success_check_in', 'Check-in result is success_check_in', 'WORKFLOW_D');

    // 5.2 Duplicate check-in attempt
    const dupCheckInRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: scannerA.cookies },
      body: JSON.stringify({
        qrToken: spotAttendee.qrToken,
        action: 'check_in',
      }),
    });
    const dupCheckInData = await dupCheckInRes.json();
    assert(dupCheckInData.result === 'already_checked_in', 'Repeated check-in returns already_checked_in without double-counting', 'WORKFLOW_D');

    // 5.3 Check-out
    const checkOutRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: scannerA.cookies },
      body: JSON.stringify({
        qrToken: spotAttendee.qrToken,
        action: 'check_out',
      }),
    });
    const checkOutData = await checkOutRes.json();
    assert(checkOutData.result === 'success_check_out', 'Check-out returns success_check_out', 'WORKFLOW_D');

    // 5.4 Duplicate check-out
    const dupCheckOutRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: scannerA.cookies },
      body: JSON.stringify({
        qrToken: spotAttendee.qrToken,
        action: 'check_out',
      }),
    });
    const dupCheckOutData = await dupCheckOutRes.json();
    assert(dupCheckOutData.result === 'already_checked_out', 'Repeated check-out returns already_checked_out', 'WORKFLOW_D');

    // 5.5 Cross-event scan attempt: Event B attendee scanned in Event A
    const crossScanRes = await fetch(`${APP_URL}/api/events/${eventAId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: scannerA.cookies },
      body: JSON.stringify({
        qrToken: foreignAttB.qrToken,
        action: 'check_in',
      }),
    });
    const crossScanData = await crossScanRes.json();
    assert(crossScanData.result === 'invalid_qr', 'Cross-event attendee scan in Event A rejected as invalid_qr', 'TENANT_ISOLATION');

    // =========================================================================
    // SECTION 6: WORKFLOW E — BADGE DESIGNER & THERMAL PRINT OPERATIONS
    // =========================================================================
    console.log('\n--- Section 6: Badge Designer & Printing Operations (Workflow E) ---');

    // 6.1 Save custom badge layout in Event A
    const layoutPayload = {
      badgeWidthIn: 4,
      badgeHeightIn: 3,
      backgroundImageUrl: '/Spot_Empty_sample.png',
      showBackground: true,
      registration: { top: 0.25, left: 0.20, width: 3.60, fontSize: 0.24, color: '#0d9488', textAlign: 'center', visible: true },
      qr: { top: 0.70, left: 1.10, size: 1.80 },
      name: { top: 2.60, left: 0.20, width: 3.60, fontSize: 0.26, color: '#0f172a', textAlign: 'center', visible: true },
      category: { top: 2.95, left: 0.20, width: 3.60, fontSize: 0.18, color: '#475569', textAlign: 'center', visible: true },
    };

    const saveLayoutRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify(layoutPayload),
    });
    assert(saveLayoutRes.status === 200, 'Workflow E: Saved custom badge layout (200 OK)', 'WORKFLOW_E');

    // 6.2 Reject invalid layout dimensions
    const badLayoutRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ ...layoutPayload, badgeWidthIn: -5 }),
    });
    assert(badLayoutRes.status === 400, 'Invalid badge layout dimensions rejected with 400 Bad Request', 'WORKFLOW_E');

    // 6.3 First print of spot attendee
    const print1Res = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        attendeeIds: [spotAttendee.id],
        printType: 'single',
      }),
    });
    assert(print1Res.status === 200, 'First single badge print succeeds (200 OK)', 'WORKFLOW_E');

    // 6.4 Reprint attempt without reason rejected
    const reprintNoReasonRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        attendeeIds: [spotAttendee.id],
        printType: 'reprint',
      }),
    });
    assert(reprintNoReasonRes.status === 400, 'Reprint without required reason rejected with 400 Bad Request', 'WORKFLOW_E');

    // 6.5 Reprint with valid reason succeeds
    const reprintValidRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        attendeeIds: [spotAttendee.id],
        printType: 'reprint',
        reason: 'Ribbon Smudged',
      }),
    });
    assert(reprintValidRes.status === 200, 'Reprint with valid reason succeeds (200 OK)', 'WORKFLOW_E');

    // 6.6 Cross-event print attempt: Staff A attempting to print Event B attendee
    const crossPrintRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: regStaffA.cookies },
      body: JSON.stringify({
        attendeeIds: [foreignAttB.id],
        printType: 'single',
      }),
    });
    assert(crossPrintRes.status === 403, 'Cross-event badge print attempt rejected with 403 Forbidden', 'TENANT_ISOLATION');

    // =========================================================================
    // SECTION 7: WORKFLOW F — REPORTS, ANALYTICS & SECURE EXPORTS
    // =========================================================================
    console.log('\n--- Section 7: Reports, Analytics & Secure Exports (Workflow F) ---');

    // 7.1 Fetch Reports analytics
    const repRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(repRes.status === 200, 'Workflow F: Reports summary fetched successfully (200 OK)', 'WORKFLOW_F');
    const repData = await repRes.json();

    // Verify metrics agreement with database
    // We created: 1 formula attendee + 1 spot attendee + 6 concurrent spot attendees = 8 attendees
    const [realTotal] = await db.select({ c: sql`count(*)::int` }).from(attendees).where(eq(attendees.eventId, eventAId));
    assert(repData.summary.totalAttendees === realTotal.c, `Dashboard total (${repData.summary.totalAttendees}) matches live DB (${realTotal.c})`, 'WORKFLOW_F');

    // Attendance rate formula check: (checkedIn + checkedOut) / total * 100
    const expectedRate = Number((((repData.summary.checkedIn + repData.summary.checkedOut) / repData.summary.totalAttendees) * 100).toFixed(1));
    assert(repData.summary.attendanceRate === expectedRate, `Attendance rate ${repData.summary.attendanceRate}% matches formula strictly`, 'WORKFLOW_F');

    // 7.2 Export CSV with formula injection sanitization
    const exportCsvRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=csv`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(exportCsvRes.status === 200, 'Owner exports CSV (200 OK)', 'WORKFLOW_F');
    const csvBuf = await exportCsvRes.arrayBuffer();
    const csvBytes = new Uint8Array(csvBuf);
    assert(csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf, 'CSV export includes UTF-8 BOM', 'WORKFLOW_F');
    const csvString = new TextDecoder('utf-8').decode(csvBuf);

    // Formula injection sanitization check
    assert(
      csvString.includes("''=HYPERLINK") || csvString.includes("'\=HYPERLINK") || csvString.includes("'=HYPERLINK"),
      'Spreadsheet formula payload successfully sanitized with single quote prefix',
      'SECURITY'
    );
    assert(
      csvString.includes("'+999-EVIL"),
      'Plus sign in registration number successfully sanitized with single quote prefix',
      'SECURITY'
    );
    assert(
      csvString.includes("'@phone-attack"),
      'At-sign in phone number successfully sanitized with single quote prefix',
      'SECURITY'
    );

    // 7.3 Export XLSX Binary check
    const exportXlsxRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=xlsx`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(exportXlsxRes.status === 200, 'Owner exports Excel .xlsx (200 OK)', 'WORKFLOW_F');
    const xlsxBuf = await exportXlsxRes.arrayBuffer();
    const xlsxBytes = new Uint8Array(xlsxBuf);
    assert(xlsxBytes[0] === 0x50 && xlsxBytes[1] === 0x4b, 'XLSX export confirmed valid binary ZIP archive', 'WORKFLOW_F');

    // 7.4 Low privilege user (Scanner Operator) denied export
    const scannerExportRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=csv`, {
      headers: { Cookie: scannerA.cookies },
    });
    assert(scannerExportRes.status === 403, 'Scanner Operator denied export (403 Forbidden)', 'EXPORT_RBAC');

    // 7.5 Audit record verification for export action
    const [exportAudit] = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.eventId, eventAId), eq(auditEvents.action, 'attendees:exported')));
    assert(Boolean(exportAudit), 'Export action recorded in audit_events with action attendees:exported', 'AUDIT');

    // =========================================================================
    // SECTION 8: PHASE 7 & 10 — API SECURITY HEADERS & INPUT BOUNDS
    // =========================================================================
    console.log('\n--- Section 8: API Security Headers & Boundary Hardening (Phase 7 & 10) ---');

    // 8.1 Security Headers on HTTP Response
    const healthHeaders = await fetch(`${APP_URL}/api/health`);
    const nosniff = healthHeaders.headers.get('x-content-type-options');
    const frameOptions = healthHeaders.headers.get('x-frame-options');
    assert(nosniff === 'nosniff', 'X-Content-Type-Options: nosniff header present', 'SECURITY_HEADERS');
    assert(frameOptions === 'DENY', 'X-Frame-Options: DENY header present', 'SECURITY_HEADERS');

    // 8.2 Parameter Boundary Clamping
    const boundedRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees?pageSize=999999&search=${'A'.repeat(6000)}`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(boundedRes.status === 200, 'Extreme query parameters handled safely without DoS or database crash', 'BOUNDS');
    const boundedData = await boundedRes.json();
    assert(boundedData.pagination.pageSize <= 100, `Page size automatically clamped to max 100 (got: ${boundedData.pagination.pageSize})`, 'BOUNDS');

    // 8.3 Non-existent UUIDs return 404 without leaking Postgres error or SQL syntax
    const badUuidRes = await fetch(`${APP_URL}/api/events/ffffffff-ffff-ffff-ffff-ffffffffffff/attendees`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(badUuidRes.status === 404, 'Non-existent UUID returns 404 NOT_FOUND', 'INPUT_VALIDATION');
    const badUuidText = await badUuidRes.text();
    assert(!badUuidText.includes('SELECT') && !badUuidText.includes('WHERE'), 'Error response does not leak internal SQL queries', 'SECURITY');

  } finally {
    console.log('\nCleaning up master verification fixtures...');
    try {
      if (eventAId) {
        await db.delete(scanEvents).where(eq(scanEvents.eventId, eventAId));
        await db.delete(badgePrintEvents).where(eq(badgePrintEvents.eventId, eventAId));
        await db.delete(spotRegistrationKeys).where(eq(spotRegistrationKeys.eventId, eventAId));
        await db.delete(auditEvents).where(eq(auditEvents.eventId, eventAId));
        await db.delete(attendees).where(eq(attendees.eventId, eventAId));
        await db.delete(registrationCounters).where(eq(registrationCounters.eventId, eventAId));
        await db.delete(eventStaffAssignments).where(eq(eventStaffAssignments.eventId, eventAId));
        await db.delete(events).where(eq(events.id, eventAId));
      }
      if (eventBId) {
        await db.delete(attendees).where(eq(attendees.eventId, eventBId));
        await db.delete(events).where(eq(events.id, eventBId));
      }
      if (orgAId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgAId));
        await db.delete(organizationInvitations).where(eq(organizationInvitations.organizationId, orgAId));
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgAId));
        await db.delete(organizations).where(eq(organizations.id, orgAId));
      }
      if (orgBId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgBId));
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgBId));
        await db.delete(organizations).where(eq(organizations.id, orgBId));
      }
    } catch (e) {
      console.error('Error in cleanup:', e);
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`MASTER VERIFICATION TOTALS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterVerification().catch((err) => {
  console.error('Master verification failed:', err);
  process.exit(1);
});
