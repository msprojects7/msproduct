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

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runSecurityHardeningTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 4 SECURITY HARDENING & REGRESSION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, level = 'HARDENING') {
    if (condition) {
      console.log(`✓ [${level}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${level}] FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Dev Server Health Check
  const hc = await fetch(`${APP_URL}/api/health`);
  if (!hc.ok) {
    console.error('Dev server not responding at /api/health');
    process.exit(1);
  }

  const ts = Date.now();
  let orgAId = '';
  let orgBId = '';
  let eventAId = '';
  let eventBId = '';
  const eventASlug = `sec-hard-a-${ts}`;
  const eventBSlug = `sec-hard-b-${ts}`;

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

    ownerUser = await signUpUser(`sec-owner-${ts}@example.com`, 'Security Owner');
    regStaffUser = await signUpUser(`sec-regstaff-${ts}@example.com`, 'Security RegStaff');
    scannerUser = await signUpUser(`sec-scanner-${ts}@example.com`, 'Security Scanner');
    outsiderUser = await signUpUser(`sec-outsider-${ts}@example.com`, 'Security Outsider');

    // Create Org A
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Sec Org A (${ts})`, slug: `sec-org-a-${ts}` }),
    });
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    // Create Event A
    const evARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: `Event Alpha (${ts})`, slug: eventASlug }),
    });
    const evAData = await evARes.json();
    eventAId = evAData.event.id;

    // Create Org B & Event B (Foreign Tenant)
    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Sec Org B (${ts})`, slug: `sec-org-b-${ts}` }),
    });
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    const evBRes = await fetch(`${APP_URL}/api/organizations/${orgBId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: `Event Beta (${ts})`, slug: eventBSlug }),
    });
    const evBData = await evBRes.json();
    eventBId = evBData.event.id;

    // Assign Roles in Event A
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

    // -------------------------------------------------------------------------
    // TEST 1: CONCURRENT CREATION RACE CONDITION WITH DUPLICATE REG NO
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: CONCURRENT CREATION RACE CONDITION ---');
    const raceRegNo = `RACE-REG-${ts}`;
    const concurrentPayload = {
      name: 'Race Candidate',
      registrationNumber: raceRegNo,
      category: 'Delegate',
      phoneNumber: '+919988776655',
      email: `race_${ts}@example.com`,
    };

    const [req1, req2] = await Promise.all([
      fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify(concurrentPayload),
      }),
      fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
        body: JSON.stringify(concurrentPayload),
      }),
    ]);

    const status1 = req1.status;
    const status2 = req2.status;
    const json1 = await req1.json();
    const json2 = await req2.json();

    const oneCreated = (status1 === 201 && status2 === 409) || (status1 === 409 && status2 === 201);
    const codeConflict = json1.code === 'REGISTRATION_NUMBER_EXISTS' || json2.code === 'REGISTRATION_NUMBER_EXISTS';

    assert(
      oneCreated && codeConflict,
      'Concurrent creation of identical registration numbers results in exactly 1 CREATED (201) and 1 CONFLICT (409)',
      'CONCURRENCY'
    );

    // Verify exactly 1 record exists in the database
    const matchingInDb = await db
      .select()
      .from(attendees)
      .where(and(eq(attendees.eventId, eventAId), eq(attendees.registrationNumber, raceRegNo)));
    assert(
      matchingInDb.length === 1,
      'Database contains precisely 1 attendee row after concurrent race condition',
      'CONCURRENCY'
    );
    const raceCreatedId = matchingInDb[0].id;

    // -------------------------------------------------------------------------
    // TEST 2: ATTENDEE DELETION AND CASCADE OF SCAN & BADGE RECORDS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: ATTENDEE DELETION & CASCADE BEHAVIOR ---');
    // Create an attendee specifically for deletion testing
    const delTargetRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({
        name: 'Cascade Target',
        registrationNumber: `CAS-TARGET-${ts}`,
        category: 'Faculty',
      }),
    });
    const delTargetData = await delTargetRes.json();
    const cascadeAttendeeId = delTargetData.attendee.id;

    // Insert associated scan_events and badge_print_events
    const [scanEntry] = await db
      .insert(scanEvents)
      .values({
        eventId: eventAId,
        attendeeId: cascadeAttendeeId,
        action: 'check_in',
        staffUserId: scannerUser.user.id,
      })
      .returning();

    const [badgeEntry] = await db
      .insert(badgePrintEvents)
      .values({
        eventId: eventAId,
        attendeeId: cascadeAttendeeId,
        printType: 'single',
        staffUserId: ownerUser.user.id,
      })
      .returning();

    assert(
      scanEntry?.id && badgeEntry?.id,
      'Associated scan_events and badge_print_events seeded successfully for attendee',
      'CASCADE'
    );

    // Perform attendee deletion via API
    const deleteApiRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${cascadeAttendeeId}`, {
      method: 'DELETE',
      headers: { 'Cookie': ownerUser.cookies },
    });
    assert(deleteApiRes.status === 200, 'DELETE /attendees/[id] returns 200 OK', 'CASCADE');

    // Verify attendee is gone
    const checkAttDb = await db.select().from(attendees).where(eq(attendees.id, cascadeAttendeeId));
    assert(checkAttDb.length === 0, 'Attendee record is completely deleted from attendees table', 'CASCADE');

    // Verify child scan_events and badge_print_events were cleanly cascade deleted
    const checkScanDb = await db.select().from(scanEvents).where(eq(scanEvents.id, scanEntry.id));
    const checkBadgeDb = await db.select().from(badgePrintEvents).where(eq(badgePrintEvents.id, badgeEntry.id));
    assert(
      checkScanDb.length === 0 && checkBadgeDb.length === 0,
      'Associated scan_events and badge_print_events were cascade-deleted without orphaned records',
      'CASCADE'
    );

    // -------------------------------------------------------------------------
    // TEST 3: BULK DELETION WITH MIXED VALID AND FOREIGN-EVENT IDS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: BULK DELETION BOUNDARY & FOREIGN ISOLATION ---');
    // Create 2 attendees in Event A
    const a1Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: 'Alpha 1', registrationNumber: `ALP-1-${ts}`, category: 'Delegate' }),
    });
    const a1Data = await a1Res.json();
    const a2Res = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ name: 'Alpha 2', registrationNumber: `ALP-2-${ts}`, category: 'Delegate' }),
    });
    const a2Data = await a2Res.json();

    // Create 1 attendee in Foreign Event B
    const b1Res = await fetch(`${APP_URL}/api/events/${eventBId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': outsiderUser.cookies },
      body: JSON.stringify({ name: 'Beta 1 Foreign', registrationNumber: `BET-1-${ts}`, category: 'Delegate' }),
    });
    const b1Data = await b1Res.json();
    const foreignAttendeeId = b1Data.attendee.id;

    // Attack: Manager of Event A sends bulk-delete containing A1, A2, AND foreign B1
    const mixedBulkRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': ownerUser.cookies },
      body: JSON.stringify({ ids: [a1Data.attendee.id, a2Data.attendee.id, foreignAttendeeId] }),
    });
    const mixedBulkData = await mixedBulkRes.json();

    assert(
      mixedBulkRes.status === 200 && mixedBulkData.deletedCount === 2,
      'Bulk delete on Event A deleted strictly 2 attendees belonging to Event A, ignoring foreign ID',
      'BOUNDARY'
    );
    assert(
      !mixedBulkData.deletedIds.includes(foreignAttendeeId),
      'Foreign attendee ID was excluded from deletedIds list',
      'BOUNDARY'
    );

    // Verify foreign attendee B1 in Event B is STILL INTACT
    const foreignCheck = await db.select().from(attendees).where(eq(attendees.id, foreignAttendeeId));
    assert(
      foreignCheck.length === 1 && foreignCheck[0].eventId === eventBId,
      'Foreign attendee B1 remains intact and unmodified in Event B',
      'BOUNDARY'
    );

    // -------------------------------------------------------------------------
    // TEST 4: DIRECT API RBAC ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: DIRECT API RBAC ENFORCEMENT ---');

    // 4.1 Scanner Operator cannot create attendees (403)
    const scannerCreateRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ name: 'Scanner Created', registrationNumber: `SCN-${ts}`, category: 'Delegate' }),
    });
    assert(
      scannerCreateRes.status === 403,
      'Scanner Operator POST /attendees is rejected with 403 FORBIDDEN',
      'RBAC'
    );

    // 4.2 Scanner Operator cannot edit attendees (403)
    const scannerPatchRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${raceCreatedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': scannerUser.cookies },
      body: JSON.stringify({ name: 'Hacked by Scanner' }),
    });
    assert(
      scannerPatchRes.status === 403,
      'Scanner Operator PATCH /attendees/[id] is rejected with 403 FORBIDDEN',
      'RBAC'
    );

    // 4.3 Scanner Operator cannot delete attendees (403)
    const scannerDelRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${raceCreatedId}`, {
      method: 'DELETE',
      headers: { 'Cookie': scannerUser.cookies },
    });
    assert(
      scannerDelRes.status === 403,
      'Scanner Operator DELETE /attendees/[id] is rejected with 403 FORBIDDEN',
      'RBAC'
    );

    // 4.4 Registration Staff can create and edit, but CANNOT delete attendees (403)
    const regStaffCreateRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({ name: 'Spot Registered Person', registrationNumber: `SPOT-${ts}`, category: 'Delegate' }),
    });
    assert(
      regStaffCreateRes.status === 201,
      'Registration Staff POST /attendees is permitted (201 CREATED)',
      'RBAC'
    );
    const spotAttendeeId = (await regStaffCreateRes.json()).attendee.id;

    const regStaffPatchRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${spotAttendeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': regStaffUser.cookies },
      body: JSON.stringify({ foodPreference: 'Vegan' }),
    });
    assert(
      regStaffPatchRes.status === 200,
      'Registration Staff PATCH /attendees/[id] is permitted (200 OK)',
      'RBAC'
    );

    const regStaffDelRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${spotAttendeeId}`, {
      method: 'DELETE',
      headers: { 'Cookie': regStaffUser.cookies },
    });
    assert(
      regStaffDelRes.status === 403,
      'Registration Staff DELETE /attendees/[id] is strictly prohibited (403 FORBIDDEN)',
      'RBAC'
    );

    // 4.5 Cross-Tenant Isolation: Outsider cannot access Event A attendees
    const crossListRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      headers: { 'Cookie': outsiderUser.cookies },
    });
    assert(
      crossListRes.status === 403,
      'Outsider user querying Event A attendees is rejected with 403 FORBIDDEN',
      'TENANT ISOLATION'
    );

    // -------------------------------------------------------------------------
    // TEST 5: PII PROTECTION ACROSS LIST & DETAIL APIS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: PII PROTECTION ACROSS APIS ---');
    // Scanner queries listing
    const scannerListRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees`, {
      headers: { 'Cookie': scannerUser.cookies },
    });
    const scannerListData = await scannerListRes.json();
    const hasAnyPiiInList = scannerListData.attendees.some(
      (a) => a.phoneNumber !== null || a.email !== null || a.medicalCouncilNumber !== null
    );
    assert(
      scannerListRes.status === 200 && !hasAnyPiiInList,
      'Scanner Operator GET /attendees receives fully redacted PII across all list records',
      'PII PRIVACY'
    );

    // Scanner queries single detail
    const scannerDetailRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${spotAttendeeId}`, {
      headers: { 'Cookie': scannerUser.cookies },
    });
    const scannerDetailData = await scannerDetailRes.json();
    assert(
      scannerDetailRes.status === 200 &&
      scannerDetailData.attendee.phoneNumber === null &&
      scannerDetailData.attendee.email === null &&
      scannerDetailData.attendee.medicalCouncilNumber === null,
      'Scanner Operator GET /attendees/[id] detail receives redacted PII fields',
      'PII PRIVACY'
    );

    // Manager queries detail (PII permitted)
    const managerDetailRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees/${raceCreatedId}`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const managerDetailData = await managerDetailRes.json();
    assert(
      managerDetailRes.status === 200 &&
      managerDetailData.attendee.phoneNumber === '+919988776655' &&
      managerDetailData.attendee.email === `race_${ts}@example.com`,
      'Authorized Manager GET /attendees/[id] receives unredacted operational PII',
      'PII PRIVACY'
    );

    // -------------------------------------------------------------------------
    // TEST 6: ATOMIC AUDIT LOGGING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: ATOMIC AUDIT LOGGING ---');
    const createdAudits = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.organizationId, orgAId), eq(auditEvents.action, 'attendee:created')));
    assert(
      createdAudits.length >= 2,
      `Audit log contains atomic 'attendee:created' records (${createdAudits.length} recorded)`,
      'AUDIT'
    );

    const deletedAudits = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.organizationId, orgAId), eq(auditEvents.action, 'attendee:deleted')));
    assert(
      deletedAudits.length >= 1,
      `Audit log contains atomic 'attendee:deleted' record`,
      'AUDIT'
    );

    const bulkDeletedAudits = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.organizationId, orgAId), eq(auditEvents.action, 'attendees:bulk_deleted')));
    assert(
      bulkDeletedAudits.length >= 1 && bulkDeletedAudits[0].details?.deletedCount === 2,
      `Audit log contains atomic 'attendees:bulk_deleted' with exact count details`,
      'AUDIT'
    );

    // -------------------------------------------------------------------------
    // TEST 7: BOUNDED INPUTS & ERROR EXPOSURE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: INPUT VALIDATION & ERROR SAFETY ---');
    // Unbounded pageSize
    const hugePageRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees?pageSize=9999999`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const hugePageData = await hugePageRes.json();
    assert(
      hugePageRes.status === 200 && hugePageData.pagination.pageSize === 100,
      'Extreme pageSize query parameter is automatically clamped to max 100',
      'INPUT VALIDATION'
    );

    // Absurdly long search input does not crash or expose SQL
    const longSearch = 'A'.repeat(5000);
    const longSearchRes = await fetch(`${APP_URL}/api/events/${eventAId}/attendees?search=${longSearch}`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const longSearchData = await longSearchRes.json();
    assert(
      longSearchRes.status === 200 && Array.isArray(longSearchData.attendees),
      'Oversized search query (>5000 chars) is bounded and executes safely without SQL crash',
      'INPUT VALIDATION'
    );

    // Malformed UUID path parameter does not expose internal stack traces
    const badUuidRes = await fetch(`${APP_URL}/api/events/not-a-uuid/attendees`, {
      headers: { 'Cookie': ownerUser.cookies },
    });
    const badUuidText = await badUuidRes.text();
    assert(
      badUuidRes.status === 400 || badUuidRes.status === 404,
      'Malformed UUID parameter returns client error (400/404)',
      'SECURITY'
    );
    assert(
      !badUuidText.includes('pg_') && !badUuidText.includes('SELECT') && !badUuidText.includes('syntax error'),
      'Malformed UUID error response does NOT leak raw Postgres errors or SQL statements',
      'SECURITY'
    );

  } finally {
    // Clean up test tenants
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
  console.log(`STAGE 4 SECURITY HARDENING TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runSecurityHardeningTests().catch((err) => {
  console.error('Security Hardening Test Suite error:', err);
  process.exit(1);
});
