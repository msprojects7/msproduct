import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  eventSettings,
  attendees,
  badgePrintEvents,
  auditEvents,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage7BadgeTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 7 BADGE DESIGNER & PRINTING VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, section = 'STAGE 7') {
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
  const eventASlug = `badge-ev-${ts}`;
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

    ownerUser = await signUpUser(`badge-owner-${ts}@example.com`, 'Badge Owner');
    regStaffUser = await signUpUser(`badge-staff-${ts}@example.com`, 'Badge Reg Staff');
    scannerUser = await signUpUser(`badge-scanner-${ts}@example.com`, 'Badge Scanner');
    outsiderUser = await signUpUser(`badge-outsider-${ts}@example.com`, 'Foreign Outsider');

    // 1. Create Org A and Event A
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Badge Test Org (${ts})`, slug: `badge-org-${ts}` }),
    });
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    const evARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Badge Summit 2026 (${ts})`, slug: eventASlug }),
    });
    const evAData = await evARes.json();
    eventAId = evAData.event.id;

    // 2. Create Foreign Org B & Event B
    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Badge Org (${ts})`, slug: `foreign-badge-org-${ts}` }),
    });
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    const evBRes = await fetch(`${APP_URL}/api/organizations/${orgBId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Foreign Badge Event (${ts})`, slug: `foreign-badge-ev-${ts}` }),
    });
    const evBData = await evBRes.json();
    eventBId = evBData.event.id;

    // 3. Assign Staff Roles in Event A
    // Registration staff has event:print_badge, but lacks event:update_settings
    await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: regStaffUser.user.id, role: 'registration_staff' }),
    });

    // Scanner operator lacks both event:print_badge and event:update_settings
    await fetch(`${APP_URL}/api/events/${eventAId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ userId: scannerUser.user.id, role: 'scanner_operator' }),
    });

    // 4. Create Attendees in Event A
    const createAttendee = async (name, regNo, cat) => {
      const res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': ownerUser.cookies },
        body: JSON.stringify({ name, registrationNumber: regNo, category: cat }),
      });
      const data = await res.json();
      return data.attendee;
    };

    const att1 = await createAttendee('Dr. Evelyn Reed', 'PMCON-2001', 'Delegate');
    const att2 = await createAttendee('Prof. Marcus Vance', 'PMCON-2002', 'Faculty');
    const att3 = await createAttendee('Dr. Sarah Connor', 'PMCON-2003', 'Delegate');
    const att4 = await createAttendee('Dr. Gregory House', 'PMCON-2004', 'Faculty');

    // Create Attendee in Foreign Event B
    const foreignAttRes = await fetch(`${APP_URL}/api/events/${eventBId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: 'Foreign Delegate', registrationNumber: 'FOR-001', category: 'Delegate' }),
    });
    const foreignAttData = await foreignAttRes.json();
    const foreignAttendee = foreignAttData.attendee;

    // =========================================================================
    // TEST 1: AUTHENTICATION & CENTRALIZED RBAC ENFORCEMENT
    // =========================================================================
    console.log('--- TEST 1: AUTHENTICATION & RBAC ENFORCEMENT ---');

    // 1.1 Unauthenticated GET layout
    const unauthGetRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`);
    assert(unauthGetRes.status === 401, 'Unauthenticated GET /badges/layout returns 401 UNAUTHENTICATED', 'RBAC');

    // 1.2 Unauthenticated POST layout
    const unauthPostRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badgeWidthIn: 4, badgeHeightIn: 6 }),
    });
    assert(unauthPostRes.status === 401, 'Unauthenticated POST /badges/layout returns 401 UNAUTHENTICATED', 'RBAC');

    // 1.3 Registration Staff lacks event:update_settings (cannot modify badge layout)
    const staffLayoutRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({ badgeWidthIn: 4, badgeHeightIn: 6 }),
    });
    assert(staffLayoutRes.status === 403, 'Registration Staff without event:update_settings returns 403 FORBIDDEN on layout edit', 'RBAC');

    // 1.4 Scanner Operator lacks event:print_badge (cannot print badges)
    const scannerPrintRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ attendeeIds: [att1.id], printType: 'single' }),
    });
    assert(scannerPrintRes.status === 403, 'Scanner Operator without event:print_badge returns 403 FORBIDDEN on print request', 'RBAC');

    // 1.5 Cross-tenant user from Org B receives 403
    const crossTenantPrintRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ attendeeIds: [att1.id], printType: 'single' }),
    });
    assert(crossTenantPrintRes.status === 403, 'Cross-tenant user from foreign organization returns 403 FORBIDDEN', 'RBAC');

    // =========================================================================
    // TEST 2: BADGE LAYOUT PERSISTENCE & VALIDATION
    // =========================================================================
    console.log('\n--- TEST 2: BADGE LAYOUT PERSISTENCE & VALIDATION ---');

    // 2.1 Invalid layout payload (negative dimensions, invalid hex color)
    const invalidLayoutRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        badgeWidthIn: -5,
        registration: { color: 'not-a-color' },
      }),
    });
    assert(invalidLayoutRes.status === 400, 'Invalid layout payload with bad color and negative size returns 400 Bad Request', 'LAYOUT');

    // 2.2 Valid custom layout saved by Event Owner
    const validCustomLayout = {
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
      headers: { 'Content-Type': 'application/json', 'Cookie': ownerUser.cookies },
      body: JSON.stringify(validCustomLayout),
    });
    const saveLayoutData = await saveLayoutRes.json();
    assert(
      saveLayoutRes.status === 200 && saveLayoutData.success === true,
      'Authorized event owner successfully saves custom badge layout (200 OK)',
      'LAYOUT'
    );

    // 2.3 Verify layout persistence in event_settings table
    const [dbSetting] = await db
      .select()
      .from(eventSettings)
      .where(and(eq(eventSettings.eventId, eventAId), eq(eventSettings.key, 'badge_layout')));
    assert(
      dbSetting && dbSetting.value.badgeHeightIn === 3 && dbSetting.value.registration.color === '#0d9488',
      'Database verifies badge_layout persisted in event_settings with height=3 and color=#0d9488',
      'LAYOUT'
    );

    // 2.4 Verify layout GET returns persisted layout
    const getLayoutRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/layout`, {
      headers: { 'Cookie': regStaffUser.cookies },
    });
    const getLayoutData = await getLayoutRes.json();
    assert(
      getLayoutRes.status === 200 && getLayoutData.isDefault === false && getLayoutData.layout.badgeHeightIn === 3,
      'GET /badges/layout returns the active persisted layout (isDefault: false)',
      'LAYOUT'
    );

    // =========================================================================
    // TEST 3: SINGLE BADGE PRINTING & AUDIT LOGGING
    // =========================================================================
    console.log('\n--- TEST 3: SINGLE BADGE PRINTING ---');

    // 3.1 Check print status before printing
    const checkBeforeRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print?attendeeId=${att1.id}`, {
      headers: { 'Cookie': regStaffUser.cookies },
    });
    const checkBeforeData = await checkBeforeRes.json();
    assert(
      checkBeforeRes.status === 200 && checkBeforeData.hasPrinted === false && checkBeforeData.printCount === 0,
      'Attendee 1 initially reports hasPrinted: false and printCount: 0',
      'PRINT'
    );

    // 3.2 Registration staff prints Attendee 1
    const print1Res = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        attendeeIds: [att1.id],
        printType: 'single',
      }),
    });
    const print1Data = await print1Res.json();
    assert(
      print1Res.status === 200 && print1Data.success === true && print1Data.count === 1,
      'Registration Staff records single badge print for Attendee 1 (200 OK)',
      'PRINT'
    );

    // 3.3 Verify badge_print_events row in database
    const att1Prints = await db
      .select()
      .from(badgePrintEvents)
      .where(and(eq(badgePrintEvents.eventId, eventAId), eq(badgePrintEvents.attendeeId, att1.id)));
    assert(
      att1Prints.length === 1 && att1Prints[0].printType === 'single',
      'Database verifies badge_print_events row recorded with printType: single',
      'PRINT'
    );

    // 3.4 Verify audit_events row recorded
    const [att1Audit] = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.eventId, eventAId), eq(auditEvents.action, 'badge:printed')));
    assert(
      att1Audit && att1Audit.entityId === att1.id,
      'Database verifies audit_events row recorded with action: badge:printed',
      'AUDIT'
    );

    // 3.5 Check print status after printing
    const checkAfterRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print?attendeeId=${att1.id}`, {
      headers: { 'Cookie': regStaffUser.cookies },
    });
    const checkAfterData = await checkAfterRes.json();
    assert(
      checkAfterRes.status === 200 && checkAfterData.hasPrinted === true && checkAfterData.printCount === 1,
      'Attendee 1 now confirms hasPrinted: true and printCount: 1',
      'PRINT'
    );

    // =========================================================================
    // TEST 4: REPRINT REASON ENFORCEMENT
    // =========================================================================
    console.log('\n--- TEST 4: REPRINT REASON ENFORCEMENT ---');

    // 4.1 Reprint without reason rejected
    const reprintNoReasonRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        attendeeIds: [att1.id],
        printType: 'reprint',
        reason: '',
      }),
    });
    assert(
      reprintNoReasonRes.status === 400,
      'Reprinting without reason is rejected with 400 Bad Request',
      'REPRINT'
    );

    // 4.2 Reprint with valid reason succeeds
    const reprintValidRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        attendeeIds: [att1.id],
        printType: 'reprint',
        reason: 'Badge Damaged by Delegate',
      }),
    });
    const reprintValidData = await reprintValidRes.json();
    assert(
      reprintValidRes.status === 200 && reprintValidData.success === true,
      'Reprinting with valid reason succeeds (200 OK)',
      'REPRINT'
    );

    // 4.3 Database verifies reprint record with reason
    const att1ReprintRows = await db
      .select()
      .from(badgePrintEvents)
      .where(
        and(
          eq(badgePrintEvents.attendeeId, att1.id),
          eq(badgePrintEvents.printType, 'reprint')
        )
      );
    assert(
      att1ReprintRows.length === 1 && att1ReprintRows[0].reason === 'Badge Damaged by Delegate',
      'Database verifies badge_print_events row recorded with printType: reprint and reason text',
      'REPRINT'
    );

    // 4.4 Verify audit_events row for badge:reprinted
    const [reprintAudit] = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.eventId, eventAId), eq(auditEvents.action, 'badge:reprinted')));
    assert(
      reprintAudit && reprintAudit.details?.reason === 'Badge Damaged by Delegate',
      'Database verifies audit_events row recorded with action: badge:reprinted',
      'AUDIT'
    );

    // =========================================================================
    // TEST 5: BATCH BADGE PRINTING
    // =========================================================================
    console.log('\n--- TEST 5: BATCH BADGE PRINTING ---');

    // Print att2, att3, att4 as a batch
    const batchPrintRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        attendeeIds: [att2.id, att3.id, att4.id],
        printType: 'batch',
      }),
    });
    const batchPrintData = await batchPrintRes.json();
    assert(
      batchPrintRes.status === 200 && batchPrintData.count === 3,
      'Batch print of 3 attendees succeeds with count: 3 (200 OK)',
      'BATCH'
    );

    // Verify 3 print rows inserted
    const batchRows = await db
      .select()
      .from(badgePrintEvents)
      .where(and(eq(badgePrintEvents.eventId, eventAId), eq(badgePrintEvents.printType, 'batch')));
    assert(
      batchRows.length === 3,
      `Database confirms exactly 3 batch print events recorded (got: ${batchRows.length})`,
      'BATCH'
    );

    // =========================================================================
    // TEST 6: CROSS-EVENT TENANT ISOLATION
    // =========================================================================
    console.log('\n--- TEST 6: CROSS-EVENT TENANT ISOLATION ---');

    // Attempting to print foreign attendee from Event B inside Event A
    const crossEventPrintRes = await fetch(`${APP_URL}/api/events/${eventAId}/badges/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({
        attendeeIds: [foreignAttendee.id],
        printType: 'single',
      }),
    });
    assert(
      crossEventPrintRes.status === 403,
      'Attempting to print an attendee from another event is rejected with 403 Forbidden',
      'ISOLATION'
    );

    // =========================================================================
    // TEST 7: FRONTEND PAGE ROUTES RENDERING (200 OK)
    // =========================================================================
    console.log('\n--- TEST 7: FRONTEND PAGE ROUTES RENDERING ---');

    // 7.1 Badges Desk Page
    const deskPageRes = await fetch(`${APP_URL}/events/${eventASlug}/badges`, {
      headers: { 'Cookie': regStaffUser.cookies },
      redirect: 'manual',
    });
    assert(
      deskPageRes.status === 200 && !deskPageRes.headers.get('location'),
      'Next.js /events/[eventSlug]/badges renders successfully (HTTP 200 OK)',
      'PAGE ROUTE'
    );

    // 7.2 Badge Designer Page
    const designerPageRes = await fetch(`${APP_URL}/events/${eventASlug}/badges/designer`, {
      headers: { 'Cookie': ownerUser.cookies },
      redirect: 'manual',
    });
    assert(
      designerPageRes.status === 200 && !designerPageRes.headers.get('location'),
      'Next.js /events/[eventSlug]/badges/designer renders successfully (HTTP 200 OK)',
      'PAGE ROUTE'
    );

  } catch (err) {
    console.error('Unexpected test error occurred:', err);
    assert(false, `Test execution failed with error: ${err.message}`, 'EXCEPTION');
  } finally {
    // Teardown test data
    console.log('\nCleaning up Stage 7 test data...');
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
  console.log(`STAGE 7 BADGE TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage7BadgeTests();
