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
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage8ReportsTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 8 REPORTS, ANALYTICS & DATA EXPORT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, section = 'STAGE 8') {
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
  const eventASlug = `report-ev-a-${ts}`;
  let orgBId = '';
  let eventBId = '';
  const eventBSlug = `report-ev-b-${ts}`;
  let emptyEventId = '';
  const emptyEventSlug = `empty-ev-${ts}`;

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

    ownerUser = await signUpUser(`rep-owner-${ts}@example.com`, 'Report Owner');
    regStaffUser = await signUpUser(`rep-staff-${ts}@example.com`, 'Report Staff');
    scannerUser = await signUpUser(`rep-scanner-${ts}@example.com`, 'Report Scanner');
    outsiderUser = await signUpUser(`rep-outsider-${ts}@example.com`, 'Report Outsider');

    // 1. Create Organization A & Event A
    const [orgA] = await db
      .insert(organizations)
      .values({
        name: `Reports Org A ${ts}`,
        slug: `rep-org-a-${ts}`,
        ownerId: ownerUser.user.id,
      })
      .returning();
    orgAId = orgA.id;

    await db.insert(organizationMembers).values({
      organizationId: orgAId,
      userId: ownerUser.user.id,
      role: 'owner',
      isActive: true,
    });

    const [eventA] = await db
      .insert(events)
      .values({
        organizationId: orgAId,
        name: `Reports Event A ${ts}`,
        slug: eventASlug,
        status: 'published',
      })
      .returning();
    eventAId = eventA.id;

    // Assign regStaffUser and scannerUser to Event A
    await db.insert(eventStaffAssignments).values([
      {
        eventId: eventAId,
        userId: regStaffUser.user.id,
        role: 'registration_staff',
        isActive: true,
      },
      {
        eventId: eventAId,
        userId: scannerUser.user.id,
        role: 'scanner_operator',
        isActive: true,
      },
    ]);

    // 2. Create Organization B & Event B (Tenant Isolation Boundary)
    const [orgB] = await db
      .insert(organizations)
      .values({
        name: `Reports Org B ${ts}`,
        slug: `rep-org-b-${ts}`,
        ownerId: outsiderUser.user.id,
      })
      .returning();
    orgBId = orgB.id;

    await db.insert(organizationMembers).values({
      organizationId: orgBId,
      userId: outsiderUser.user.id,
      role: 'owner',
      isActive: true,
    });

    const [eventB] = await db
      .insert(events)
      .values({
        organizationId: orgBId,
        name: `Reports Event B ${ts}`,
        slug: eventBSlug,
        status: 'published',
      })
      .returning();
    eventBId = eventB.id;

    // 3. Create Empty Event in Org A (Zero Division Guard Test)
    const [emptyEv] = await db
      .insert(events)
      .values({
        organizationId: orgAId,
        name: `Zero Attendees Event ${ts}`,
        slug: emptyEventSlug,
        status: 'published',
      })
      .returning();
    emptyEventId = emptyEv.id;

    // 4. Seed attendees in Event A
    const [att1, att2, att3, att4, att5] = await db
      .insert(attendees)
      .values([
        {
          eventId: eventAId,
          registrationNumber: `REG-DEL-${ts}-1`,
          name: 'Alice Delegate',
          category: 'Delegate',
          phoneNumber: '+1999888001',
          email: 'alice@example.com',
          gender: 'Female',
          paymentStatus: 'Paid',
          registrationType: 'pre_registered',
          attendanceStatus: 'checked_in',
        },
        {
          eventId: eventAId,
          registrationNumber: `REG-FAC-${ts}-2`,
          name: 'Bob Faculty',
          category: 'Faculty',
          phoneNumber: '+1999888002',
          email: 'bob@example.com',
          gender: 'Male',
          paymentStatus: 'Paid',
          registrationType: 'pre_registered',
          attendanceStatus: 'checked_out',
        },
        {
          eventId: eventAId,
          registrationNumber: `REG-VIP-${ts}-3`,
          name: 'Charlie VIP',
          category: 'VIP',
          phoneNumber: '+1999888003',
          email: 'charlie@example.com',
          paymentStatus: 'Pending',
          registrationType: 'spot',
          attendanceStatus: 'not_checked_in',
        },
        {
          eventId: eventAId,
          registrationNumber: `REG-STU-${ts}-4`,
          name: 'Diana Student',
          category: 'Student',
          paymentStatus: 'Complimentary',
          registrationType: 'spot',
          attendanceStatus: 'not_checked_in',
        },
        // Formula injection candidate
        {
          eventId: eventAId,
          registrationNumber: `+999-EVIL-${ts}-5`,
          name: '=HYPERLINK("http://attacker.com","Click")',
          category: 'Delegate',
          phoneNumber: '@phone-attack',
          email: '-email-attack@example.com',
          paymentStatus: 'Paid',
          registrationType: 'pre_registered',
          attendanceStatus: 'not_checked_in',
        },
      ])
      .returning();

    // Seed 1 attendee in Event B (should NEVER leak into Event A reports)
    await db.insert(attendees).values({
      eventId: eventBId,
      registrationNumber: `REG-ORGB-${ts}`,
      name: 'Zara Outsider',
      category: 'Delegate',
      paymentStatus: 'Paid',
      registrationType: 'pre_registered',
      attendanceStatus: 'checked_in',
    });

    // Seed Scan events in Event A
    await db.insert(scanEvents).values([
      {
        eventId: eventAId,
        attendeeId: att1.id,
        action: 'check_in',
        staffUserId: scannerUser.user.id,
      },
      {
        eventId: eventAId,
        attendeeId: att2.id,
        action: 'check_in',
        staffUserId: scannerUser.user.id,
      },
      {
        eventId: eventAId,
        attendeeId: att2.id,
        action: 'check_out',
        staffUserId: scannerUser.user.id,
      },
    ]);

    // Seed Badge Print event in Event A
    await db.insert(badgePrintEvents).values({
      eventId: eventAId,
      attendeeId: att1.id,
      printType: 'single',
      staffUserId: ownerUser.user.id,
    });

    // Seed an audit event in Event A
    await db.insert(auditEvents).values({
      organizationId: orgAId,
      eventId: eventAId,
      userId: ownerUser.user.id,
      action: 'spot_registration:created',
      entityType: 'attendee',
      entityId: att3.id,
    });

    // ================================================================
    // SECTION 1: AUTHENTICATION & ACCESS CONTROL ON REPORTS API
    // ================================================================
    console.log('\n--- Section 1: Authentication & Access Control ---');

    // 1. Unauthenticated request rejected
    const unauthRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`);
    assert(unauthRes.status === 401, 'Unauthenticated request receives 401 Unauthorized', 'AUTH');

    // 2. Outsider user rejected with 403 or 404
    const outsiderRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`, {
      headers: { Cookie: outsiderUser.cookies },
    });
    assert(
      outsiderRes.status === 403 || outsiderRes.status === 404,
      `Outsider user rejected with ${outsiderRes.status}`,
      'AUTH'
    );

    // 3. Org Owner allowed
    const ownerRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(ownerRes.status === 200, 'Org Owner can view reports (200 OK)', 'RBAC');
    const ownerData = await ownerRes.json();

    // 4. Registration Staff allowed
    const staffRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`, {
      headers: { Cookie: regStaffUser.cookies },
    });
    assert(staffRes.status === 200, 'Registration Staff can view reports (200 OK)', 'RBAC');

    // 5. Scanner Operator allowed to view reports
    const scannerRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports`, {
      headers: { Cookie: scannerUser.cookies },
    });
    assert(scannerRes.status === 200, 'Scanner Operator can view reports (200 OK)', 'RBAC');

    // ================================================================
    // SECTION 2: REPORT METRICS & DATA INTEGRITY
    // ================================================================
    console.log('\n--- Section 2: Report Metrics & Data Integrity ---');

    const summary = ownerData.summary;
    assert(summary.totalAttendees === 5, `Total attendees count is 5 (got ${summary.totalAttendees})`, 'METRICS');
    assert(summary.checkedIn === 1, `Checked-in attendees count is 1 (got ${summary.checkedIn})`, 'METRICS');
    assert(summary.checkedOut === 1, `Checked-out attendees count is 1 (got ${summary.checkedOut})`, 'METRICS');
    assert(summary.notCheckedIn === 3, `Not checked-in count is 3 (got ${summary.notCheckedIn})`, 'METRICS');

    // Attendance rate = (1 checked-in + 1 checked-out) / 5 total * 100 = 40.0%
    assert(summary.attendanceRate === 40.0, `Attendance rate is 40.0% (got ${summary.attendanceRate}%)`, 'METRICS');

    // Registration types: 3 pre_registered, 2 spot
    assert(summary.preRegistrations === 3, `Pre-registrations count is 3 (got ${summary.preRegistrations})`, 'METRICS');
    assert(summary.spotRegistrations === 2, `Spot registrations count is 2 (got ${summary.spotRegistrations})`, 'METRICS');

    // Payments: 3 Paid, 1 Pending, 1 Complimentary
    assert(summary.paidCount === 3, `Paid count is 3 (got ${summary.paidCount})`, 'METRICS');
    assert(summary.pendingCount === 1, `Pending count is 1 (got ${summary.pendingCount})`, 'METRICS');
    assert(summary.complimentaryCount === 1, `Complimentary count is 1 (got ${summary.complimentaryCount})`, 'METRICS');

    // Scans & Badges
    assert(summary.totalScans === 3, `Total scans count is 3 (got ${summary.totalScans})`, 'METRICS');
    assert(summary.checkInScans === 2, `Check-in scans count is 2 (got ${summary.checkInScans})`, 'METRICS');
    assert(summary.checkOutScans === 1, `Check-out scans count is 1 (got ${summary.checkOutScans})`, 'METRICS');
    assert(summary.badgesPrinted === 1, `Badges printed count is 1 (got ${summary.badgesPrinted})`, 'METRICS');

    // Category Breakdown
    const catBreakdown = ownerData.categoryBreakdown;
    const delegateCat = catBreakdown.find((c) => c.category === 'Delegate');
    assert(Boolean(delegateCat && delegateCat.count === 2), 'Category breakdown correctly groups 2 Delegates', 'BREAKDOWN');
    const facultyCat = catBreakdown.find((c) => c.category === 'Faculty');
    assert(Boolean(facultyCat && facultyCat.count === 1), 'Category breakdown correctly groups 1 Faculty', 'BREAKDOWN');

    // Zero attendees event: safe zero division guard
    const zeroRes = await fetch(`${APP_URL}/api/events/${emptyEventId}/reports`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(zeroRes.status === 200, 'Zero-attendee event reports endpoint returns 200 OK', 'SAFETY');
    const zeroData = await zeroRes.json();
    assert(
      zeroData.summary.totalAttendees === 0 && zeroData.summary.attendanceRate === 0,
      'Zero-attendee event safely reports 0% attendance rate without error',
      'SAFETY'
    );

    // ================================================================
    // SECTION 3: DATE & CATEGORY FILTERS
    // ================================================================
    console.log('\n--- Section 3: Date & Category Filters ---');

    // 1. Preset today filter
    const todayRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports?preset=today`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(todayRes.status === 200, 'Preset "today" filter returns 200 OK', 'FILTERS');
    const todayData = await todayRes.json();
    assert(todayData.summary.totalAttendees === 5, 'Preset "today" includes newly created attendees', 'FILTERS');

    // 2. Preset 7d filter
    const weekRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports?preset=7d`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(weekRes.status === 200, 'Preset "7d" filter returns 200 OK', 'FILTERS');

    // 3. Category filter
    const catFilterRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports?category=Faculty`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(catFilterRes.status === 200, 'Category filter returns 200 OK', 'FILTERS');
    const catFilterData = await catFilterRes.json();
    assert(
      catFilterData.summary.totalAttendees === 1,
      `Category filter "Faculty" returns 1 attendee (got ${catFilterData.summary.totalAttendees})`,
      'FILTERS'
    );

    // 4. Invalid date range (from > to)
    const invalidDateRes = await fetch(
      `${APP_URL}/api/events/${eventAId}/reports?preset=custom&from=2026-12-31&to=2026-01-01`,
      { headers: { Cookie: ownerUser.cookies } }
    );
    assert(
      invalidDateRes.status === 400,
      'Invalid date range (from > to) rejected with 400 Bad Request',
      'FILTERS'
    );

    // 5. Exceeded date range (> 366 days)
    const hugeDateRes = await fetch(
      `${APP_URL}/api/events/${eventAId}/reports?preset=custom&from=2020-01-01&to=2025-01-01`,
      { headers: { Cookie: ownerUser.cookies } }
    );
    assert(
      hugeDateRes.status === 400,
      'Date range exceeding 366 days rejected with 400 Bad Request',
      'FILTERS'
    );

    // ================================================================
    // SECTION 4: STAFF ACTIVITY FEED & RECENT LOGS
    // ================================================================
    console.log('\n--- Section 4: Staff Activity & Audit Stream ---');

    assert(
      Array.isArray(ownerData.recentActivity.scans) && ownerData.recentActivity.scans.length >= 3,
      `Recent scans activity stream returns authoritative scan records (${ownerData.recentActivity.scans.length} scans)`,
      'ACTIVITY'
    );
    assert(
      Array.isArray(ownerData.recentActivity.audits) && ownerData.recentActivity.audits.length >= 1,
      `Recent audits stream returns authoritative audit events (${ownerData.recentActivity.audits.length} audits)`,
      'ACTIVITY'
    );

    // ================================================================
    // SECTION 5: DATA EXPORT (CSV, EXCEL, RBAC & FORMULA INJECTION)
    // ================================================================
    console.log('\n--- Section 5: Data Export & Security Verification ---');

    // 1. RBAC Check on Export: Registration Staff is NOT permitted to export
    const staffExportRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=csv`, {
      headers: { Cookie: regStaffUser.cookies },
    });
    assert(
      staffExportRes.status === 403,
      `Registration Staff denied export with 403 Forbidden (got ${staffExportRes.status})`,
      'EXPORT_RBAC'
    );

    // 2. RBAC Check on Export: Scanner Operator is NOT permitted to export
    const scannerExportRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=csv`, {
      headers: { Cookie: scannerUser.cookies },
    });
    assert(
      scannerExportRes.status === 403,
      `Scanner Operator denied export with 403 Forbidden (got ${scannerExportRes.status})`,
      'EXPORT_RBAC'
    );

    // 3. Org Owner permitted to export CSV
    const ownerCsvRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=csv`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(ownerCsvRes.status === 200, 'Org Owner can export CSV (200 OK)', 'EXPORT');
    const contentType = ownerCsvRes.headers.get('content-type') || '';
    assert(contentType.includes('text/csv'), `Content-Type is text/csv (got ${contentType})`, 'EXPORT');
    const contentDisp = ownerCsvRes.headers.get('content-disposition') || '';
    assert(contentDisp.includes('attachment; filename='), `Content-Disposition has attachment filename`, 'EXPORT');

    const csvBuffer = await ownerCsvRes.arrayBuffer();
    const csvBytes = new Uint8Array(csvBuffer);
    const hasBom = csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf;
    assert(hasBom, 'CSV begins with UTF-8 BOM (0xEF, 0xBB, 0xBF) for Excel compatibility', 'EXPORT');
    const csvText = new TextDecoder('utf-8').decode(csvBuffer);

    // 4. Spreadsheet Formula Injection Defense
    // Check that att5's name, regNo, phone starting with =, +, @ were sanitized with leading quote
    assert(
      csvText.includes("''=HYPERLINK") || csvText.includes("'\=HYPERLINK") || csvText.includes("'=HYPERLINK"),
      'Formula injection in name successfully sanitized with leading single quote',
      'SECURITY'
    );
    assert(
      csvText.includes("'+999-EVIL"),
      'Plus sign in registration number successfully sanitized with leading single quote',
      'SECURITY'
    );
    assert(
      csvText.includes("'@phone-attack"),
      'At symbol in phone number successfully sanitized with leading single quote',
      'SECURITY'
    );

    // 5. Excel (.xlsx) Export
    const ownerXlsxRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=xlsx`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(ownerXlsxRes.status === 200, 'Org Owner can export Excel .xlsx (200 OK)', 'EXPORT');
    const xlsxContentType = ownerXlsxRes.headers.get('content-type') || '';
    assert(
      xlsxContentType.includes('spreadsheetml.sheet'),
      `Content-Type is openxmlformats spreadsheet (got ${xlsxContentType})`,
      'EXPORT'
    );
    const xlsxBuffer = await ownerXlsxRes.arrayBuffer();
    const xlsxBytes = new Uint8Array(xlsxBuffer);
    // PK zip header (0x50, 0x4B)
    assert(
      xlsxBytes.length > 500 && xlsxBytes[0] === 0x50 && xlsxBytes[1] === 0x4b,
      `Excel file returned as valid binary XLSX ZIP archive (${xlsxBytes.length} bytes)`,
      'EXPORT'
    );

    // 6. Audit Event Check: Export activity logged
    const [exportAudit] = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.eventId, eventAId),
          eq(auditEvents.action, 'attendees:exported')
        )
      )
      .limit(1);

    assert(
      Boolean(exportAudit && exportAudit.userId === ownerUser.user.id),
      'Sensitive data export recorded in audit_events with action "attendees:exported"',
      'AUDIT'
    );

    // ================================================================
    // SECTION 6: FRONTEND REPORTS PAGE ACCESSIBILITY
    // ================================================================
    console.log('\n--- Section 6: Next.js Frontend Page Serving ---');

    const pageRes = await fetch(`${APP_URL}/events/${eventASlug}/reports`, {
      headers: { Cookie: ownerUser.cookies },
    });
    assert(pageRes.status === 200, `Reports UI page /events/[slug]/reports loads with 200 OK`, 'FRONTEND');
    const pageHtml = await pageRes.text();
    assert(
      pageHtml.includes('Reports') || pageHtml.includes('Analytics') || pageHtml.includes('self.__next_f'),
      'Reports UI rendered Next.js application payload',
      'FRONTEND'
    );

  } finally {
    // Clean up test data
    console.log('\nCleaning up Stage 8 test data...');
    try {
      if (eventAId) {
        await db.delete(scanEvents).where(eq(scanEvents.eventId, eventAId));
        await db.delete(badgePrintEvents).where(eq(badgePrintEvents.eventId, eventAId));
        await db.delete(auditEvents).where(eq(auditEvents.eventId, eventAId));
        await db.delete(attendees).where(eq(attendees.eventId, eventAId));
        await db.delete(eventStaffAssignments).where(eq(eventStaffAssignments.eventId, eventAId));
        await db.delete(events).where(eq(events.id, eventAId));
      }
      if (eventBId) {
        await db.delete(attendees).where(eq(attendees.eventId, eventBId));
        await db.delete(events).where(eq(events.id, eventBId));
      }
      if (emptyEventId) {
        await db.delete(events).where(eq(events.id, emptyEventId));
      }
      if (orgAId) {
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgAId));
        await db.delete(organizations).where(eq(organizations.id, orgAId));
      }
      if (orgBId) {
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgBId));
        await db.delete(organizations).where(eq(organizations.id, orgBId));
      }
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`STAGE 8 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage8ReportsTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
