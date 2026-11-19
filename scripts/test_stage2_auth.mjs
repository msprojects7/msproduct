import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  platformAdministrators,
  auditEvents,
} from '../db/schema/index';
import {
  requireUserSession,
  requireOrgContext,
  requireEventContext,
  requirePlatformAdminContext,
  assumeTenantSupportContext,
  AuthorizationError,
} from '../lib/auth/context';
import { eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { GET as getSettingsRoute, POST as postSettingsRoute } from '../app/api/events/[eventId]/settings/route';

async function runStage2Tests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 2 INDEPENDENT SECURITY VERIFICATION TESTS');
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

  // Test Entities Identifiers (Isolated UUIDs)
  const orgAId = 'a1111111-1111-4111-8111-111111111111';
  const orgBId = 'a2222222-2222-4222-8222-222222222222';
  const orgInactiveId = 'a3333333-3333-4333-8333-333333333333';

  const eventA1Id = 'e1111111-1111-4111-8111-111111111111';
  const eventB1Id = 'e2222222-2222-4222-8222-222222222222';

  const userOwnerA = { id: 'u1111111-1111-4111-8111-111111111111', email: 'owner_a@example.com' };
  const userAdminA = { id: 'u2222222-2222-4222-8222-222222222222', email: 'admin_a@example.com' };
  const userMemberA = { id: 'u2222222-2222-4222-8222-333333333333', email: 'member_a@example.com' };
  const userManagerE1 = { id: 'u3333333-3333-4333-8333-333333333333', email: 'manager_e1@example.com' };
  const userRegStaffE1 = { id: 'u4444444-4444-4444-8444-444444444444', email: 'reg_e1@example.com' };
  const userScannerE1 = { id: 'u5555555-5555-4555-8555-555555555555', email: 'scanner_e1@example.com' };
  const userInactiveMember = { id: 'u6666666-6666-4666-8666-666666666666', email: 'inactive_mem@example.com' };
  const userInactiveStaff = { id: 'u7777777-7777-4777-8777-777777777777', email: 'inactive_staff@example.com' };
  const userOutsider = { id: 'u8888888-8888-4888-8888-888888888888', email: 'outsider@example.com' };
  const userPlatformAdmin = { id: 'u9999999-9999-4999-8999-999999999999', email: 'platform_admin@example.com' };

  try {
    // 0. Clean up any previous test artifacts
    await db.delete(auditEvents).where(sql`${auditEvents.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(eventStaffAssignments).where(sql`${eventStaffAssignments.eventId} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(events).where(sql`${events.id} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(organizationMembers).where(sql`${organizationMembers.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(platformAdministrators).where(eq(platformAdministrators.userId, userPlatformAdmin.id));

    // 1. Seed Test Organizations
    await db.insert(organizations).values([
      { id: orgAId, name: 'Org Alpha (Active)', slug: 'org-stage2-alpha', isActive: true },
      { id: orgBId, name: 'Org Beta (Active)', slug: 'org-stage2-beta', isActive: true },
      { id: orgInactiveId, name: 'Org Inactive', slug: 'org-stage2-inactive', isActive: false },
    ]);

    // 2. Seed Organization Members
    await db.insert(organizationMembers).values([
      { organizationId: orgAId, userId: userOwnerA.id, role: 'owner', isActive: true },
      { organizationId: orgAId, userId: userAdminA.id, role: 'admin', isActive: true },
      { organizationId: orgAId, userId: userMemberA.id, role: 'member', isActive: true },
      { organizationId: orgAId, userId: userInactiveMember.id, role: 'admin', isActive: false },
    ]);

    // 3. Seed Events
    await db.insert(events).values([
      { id: eventA1Id, organizationId: orgAId, name: 'Event A1 (in Org Alpha)', slug: 'event-stage2-a1', status: 'published' },
      { id: eventB1Id, organizationId: orgBId, name: 'Event B1 (in Org Beta)', slug: 'event-stage2-b1', status: 'published' },
    ]);

    // 4. Seed Event Staff Assignments
    await db.insert(eventStaffAssignments).values([
      { eventId: eventA1Id, userId: userManagerE1.id, role: 'event_manager', isActive: true },
      { eventId: eventA1Id, userId: userRegStaffE1.id, role: 'registration_staff', isActive: true },
      { eventId: eventA1Id, userId: userScannerE1.id, role: 'scanner_operator', isActive: true },
      { eventId: eventA1Id, userId: userInactiveStaff.id, role: 'event_manager', isActive: false },
    ]);

    // 5. Seed Platform Administrator
    await db.insert(platformAdministrators).values([
      { userId: userPlatformAdmin.id, email: userPlatformAdmin.email, isActive: true },
    ]);

    console.log('[SETUP] Seeded isolated test tenants, events, memberships, and staff assignments.\n');

    // ========================================================================
    // SECTION A: AUTHORIZATION HELPERS IN ISOLATION (LEVEL A)
    // ========================================================================
    console.log('--- SECTION A: AUTHORIZATION HELPERS IN ISOLATION (LEVEL A) ---');

    // TEST 1: Unauthenticated session rejection
    let unauthCaught = false;
    try {
      await requireUserSession();
    } catch (err) {
      if (err instanceof AuthorizationError && err.statusCode === 401) {
        unauthCaught = true;
      }
    }
    assert(unauthCaught, 'Unauthenticated user rejected with 401 UNAUTHENTICATED', 'LEVEL A');

    // TEST 2: Outsider without membership
    let noMembershipCaught = false;
    try {
      await requireOrgContext('org-stage2-alpha', { overrideUser: userOutsider });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_AN_ORGANIZATION_MEMBER') {
        noMembershipCaught = true;
      }
    }
    assert(noMembershipCaught, 'Authenticated user without membership rejected with 403 NOT_AN_ORGANIZATION_MEMBER', 'LEVEL A');

    // TEST 3: Cross-organization tenant isolation
    let crossOrgCaught = false;
    try {
      await requireOrgContext('org-stage2-beta', { overrideUser: userAdminA });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_AN_ORGANIZATION_MEMBER') {
        crossOrgCaught = true;
      }
    }
    assert(crossOrgCaught, 'Cross-organization access rejected with 403 NOT_AN_ORGANIZATION_MEMBER', 'LEVEL A');

    // TEST 4: Staff accessing unassigned event
    let unassignedEventCaught = false;
    try {
      await requireEventContext(eventB1Id, { overrideUser: userManagerE1 });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'UNAUTHORIZED_EVENT_ACCESS') {
        unassignedEventCaught = true;
      }
    }
    assert(unassignedEventCaught, 'Staff accessing unassigned event rejected with 403 UNAUTHORIZED_EVENT_ACCESS', 'LEVEL A');

    // TEST 5: Inactive organization membership
    let inactiveMemCaught = false;
    try {
      await requireOrgContext('org-stage2-alpha', { overrideUser: userInactiveMember });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'MEMBERSHIP_INACTIVE') {
        inactiveMemCaught = true;
      }
    }
    assert(inactiveMemCaught, 'Inactive organization membership rejected with 403 MEMBERSHIP_INACTIVE', 'LEVEL A');

    // TEST 6: Inactive event staff assignment
    let inactiveStaffCaught = false;
    try {
      await requireEventContext(eventA1Id, { overrideUser: userInactiveStaff });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'ASSIGNMENT_INACTIVE') {
        inactiveStaffCaught = true;
      }
    }
    assert(inactiveStaffCaught, 'Inactive event staff assignment rejected with 403 ASSIGNMENT_INACTIVE', 'LEVEL A');

    // TEST 7: Plain Member Role Enforcement (Defect 2 Verification)
    const memberContext = await requireOrgContext('org-stage2-alpha', { overrideUser: userMemberA });
    assert(memberContext.effectiveRole === 'org_member', 'Plain member resolves strictly to org_member role', 'LEVEL A');
    assert(memberContext.hasPermission('org:view') === true, 'Plain member holds base org:view permission', 'LEVEL A');

    let memberCreateEventDenied = false;
    try {
      memberContext.assertPermission('org:create_event');
    } catch (err) {
      if (err.statusCode === 403) memberCreateEventDenied = true;
    }
    assert(memberCreateEventDenied, 'Plain member strictly denied org:create_event permission', 'LEVEL A');

    let memberManageMembersDenied = false;
    try {
      memberContext.assertPermission('org:manage_members');
    } catch (err) {
      if (err.statusCode === 403) memberManageMembersDenied = true;
    }
    assert(memberManageMembersDenied, 'Plain member strictly denied org:manage_members permission', 'LEVEL A');

    // TEST 8: Scanner Operator Role Permissions
    const scannerContext = await requireEventContext(eventA1Id, { overrideUser: userScannerE1 });
    assert(scannerContext.effectiveRole === 'scanner_operator', 'Scanner operator role correctly resolved', 'LEVEL A');

    let scannerSettingsDenied = false;
    try {
      scannerContext.assertPermission('event:update_settings');
    } catch (err) {
      if (err.statusCode === 403) scannerSettingsDenied = true;
    }
    assert(scannerSettingsDenied, 'Scanner operator prohibited from changing event settings', 'LEVEL A');

    let scannerAttendeePiiDenied = false;
    try {
      scannerContext.assertPermission('event:view_attendee_pii');
    } catch (err) {
      if (err.statusCode === 403) scannerAttendeePiiDenied = true;
    }
    assert(scannerAttendeePiiDenied, 'Scanner operator prohibited from direct attendee PII access', 'LEVEL A');

    let scannerDeleteAttendeeDenied = false;
    try {
      scannerContext.assertPermission('event:delete_attendee');
    } catch (err) {
      if (err.statusCode === 403) scannerDeleteAttendeeDenied = true;
    }
    assert(scannerDeleteAttendeeDenied, 'Scanner operator prohibited from deleting attendees', 'LEVEL A');
    assert(scannerContext.hasPermission('event:scan_badge') === true, 'Scanner operator allowed to scan badges', 'LEVEL A');

    // TEST 9: Registration Staff Role Permissions
    const regStaffContext = await requireEventContext(eventA1Id, { overrideUser: userRegStaffE1 });
    assert(regStaffContext.effectiveRole === 'registration_staff', 'Registration staff role correctly resolved', 'LEVEL A');

    let regStaffSettingsDenied = false;
    try {
      regStaffContext.assertPermission('event:update_settings');
    } catch (err) {
      if (err.statusCode === 403) regStaffSettingsDenied = true;
    }
    assert(regStaffSettingsDenied, 'Registration staff prohibited from updating event settings', 'LEVEL A');

    let regStaffDeleteAttendeeDenied = false;
    try {
      regStaffContext.assertPermission('event:delete_attendee');
    } catch (err) {
      if (err.statusCode === 403) regStaffDeleteAttendeeDenied = true;
    }
    assert(regStaffDeleteAttendeeDenied, 'Registration staff prohibited from deleting attendees', 'LEVEL A');
    assert(regStaffContext.hasPermission('event:create_attendee') === true, 'Registration staff allowed spot registration', 'LEVEL A');

    // TEST 10: Org Admin Role Permissions vs Org Owner
    const adminContext = await requireOrgContext('org-stage2-alpha', { overrideUser: userAdminA });
    assert(adminContext.effectiveRole === 'org_admin', 'Org admin role correctly resolved', 'LEVEL A');

    let adminTransferDenied = false;
    try {
      adminContext.assertPermission('org:transfer_ownership');
    } catch (err) {
      if (err.statusCode === 403) adminTransferDenied = true;
    }
    assert(adminTransferDenied, 'Org admin prohibited from transferring organization ownership', 'LEVEL A');

    let adminDeleteOrgDenied = false;
    try {
      adminContext.assertPermission('org:delete');
    } catch (err) {
      if (err.statusCode === 403) adminDeleteOrgDenied = true;
    }
    assert(adminDeleteOrgDenied, 'Org admin prohibited from deleting organization', 'LEVEL A');

    const ownerContext = await requireOrgContext('org-stage2-alpha', { overrideUser: userOwnerA });
    assert(ownerContext.hasPermission('org:transfer_ownership') === true, 'Org owner permitted to transfer ownership', 'LEVEL A');
    assert(ownerContext.hasPermission('org:delete') === true, 'Org owner permitted to delete organization', 'LEVEL A');

    // TEST 11: Mismatched Organization and Event Identifier Manipulation
    let manipulatedOrgEventMismatchCaught = false;
    try {
      await requireEventContext(eventA1Id, {
        orgIdOrSlug: 'org-stage2-beta',
        overrideUser: userOwnerA,
      });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'EVENT_NOT_IN_ORGANIZATION') {
        manipulatedOrgEventMismatchCaught = true;
      }
    }
    assert(manipulatedOrgEventMismatchCaught, 'Mismatched event/organization combination rejected with EVENT_NOT_IN_ORGANIZATION', 'LEVEL A');

    let nonExistentEventCaught = false;
    try {
      await requireEventContext('non-existent-event-slug-999', { overrideUser: userOwnerA });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_FOUND') {
        nonExistentEventCaught = true;
      }
    }
    assert(nonExistentEventCaught, 'Non-existent event identifier rejected with 404 NOT_FOUND', 'LEVEL A');

    // TEST 12: Deactivated Organization Access Denial
    let deactivatedOrgCaught = false;
    try {
      await requireOrgContext('org-stage2-inactive', { overrideUser: userOwnerA });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'ORGANIZATION_INACTIVE') {
        deactivatedOrgCaught = true;
      }
    }
    assert(deactivatedOrgCaught, 'Deactivated organization immediately blocks all members with 403 ORGANIZATION_INACTIVE', 'LEVEL A');

    // TEST 13: Platform Admin No-Backdoor & Auditable Support Process (Defects 1 & 3 Verification)
    const platformAdminContext = await requirePlatformAdminContext({ overrideUser: userPlatformAdmin });
    assert(platformAdminContext.role === 'platform_admin', 'Platform administrator privilege verified', 'LEVEL A');

    let platformAdminDirectBypassBlocked = false;
    try {
      await requireOrgContext(orgAId, { overrideUser: userPlatformAdmin });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_AN_ORGANIZATION_MEMBER') {
        platformAdminDirectBypassBlocked = true;
      }
    }
    assert(platformAdminDirectBypassBlocked, 'Platform admin is BLOCKED from silent backdoor access to tenant data', 'LEVEL A');

    // Verify unauthenticated or non-admin cannot initiate support session
    let nonAdminSupportDenied = false;
    try {
      await assumeTenantSupportContext(
        { organizationId: orgAId, ticketId: 'TICK-101', reason: 'Test support' },
        { overrideUser: userAdminA }
      );
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_A_PLATFORM_ADMIN') {
        nonAdminSupportDenied = true;
      }
    }
    assert(nonAdminSupportDenied, 'Non-platform-admin caller cannot initiate support session (403 NOT_A_PLATFORM_ADMIN)', 'LEVEL A');

    // Verify support session requires valid ticket ID and reason
    let emptyTicketDenied = false;
    try {
      await assumeTenantSupportContext(
        { organizationId: orgAId, ticketId: '   ', reason: 'Valid reason' },
        { overrideUser: userPlatformAdmin }
      );
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'INVALID_TICKET_ID') {
        emptyTicketDenied = true;
      }
    }
    assert(emptyTicketDenied, 'Support session requires non-whitespace ticket ID (400 INVALID_TICKET_ID)', 'LEVEL A');

    let emptyReasonDenied = false;
    try {
      await assumeTenantSupportContext(
        { organizationId: orgAId, ticketId: 'TICK-102', reason: '' },
        { overrideUser: userPlatformAdmin }
      );
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'INVALID_REASON') {
        emptyReasonDenied = true;
      }
    }
    assert(emptyReasonDenied, 'Support session requires non-empty justification reason (400 INVALID_REASON)', 'LEVEL A');

    // Verify target organization must exist and be active
    let nonExistentOrgSupportDenied = false;
    try {
      await assumeTenantSupportContext(
        { organizationId: '99999999-9999-4999-8999-999999999999', ticketId: 'TICK-103', reason: 'Investigation' },
        { overrideUser: userPlatformAdmin }
      );
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_FOUND') {
        nonExistentOrgSupportDenied = true;
      }
    }
    assert(nonExistentOrgSupportDenied, 'Support session targeting non-existent org rejected with 404 NOT_FOUND', 'LEVEL A');

    let deactivatedOrgSupportDenied = false;
    try {
      await assumeTenantSupportContext(
        { organizationId: orgInactiveId, ticketId: 'TICK-104', reason: 'Investigation' },
        { overrideUser: userPlatformAdmin }
      );
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'ORGANIZATION_INACTIVE') {
        deactivatedOrgSupportDenied = true;
      }
    }
    assert(deactivatedOrgSupportDenied, 'Support session targeting deactivated org rejected with 403 ORGANIZATION_INACTIVE', 'LEVEL A');

    // Validated support session creation: identity derived strictly from session, NOT caller parameter
    const supportSession = await assumeTenantSupportContext(
      {
        organizationId: orgAId,
        ticketId: 'TICKET-2026-9901',
        reason: 'Investigate customer reported sync delay on attendee table',
      },
      { overrideUser: userPlatformAdmin }
    );
    assert(
      supportSession.authorized && supportSession.auditId !== undefined && supportSession.adminUser.id === userPlatformAdmin.id,
      'Auditable support session granted with session-derived admin identity',
      'LEVEL A'
    );

    // Verify audit entry exists in PostgreSQL
    const [auditEntry] = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, supportSession.auditId));
    assert(
      auditEntry !== undefined &&
        auditEntry.action === 'platform:assume_support' &&
        auditEntry.userId === userPlatformAdmin.id &&
        auditEntry.details?.ticket_id === 'TICKET-2026-9901',
      'Audit log recorded immutable platform support action with ticket ID and reason in database',
      'LEVEL A'
    );

    // ========================================================================
    // SECTION B: ACTUAL NEXT.JS ROUTE HANDLERS (LEVEL B)
    // ========================================================================
    console.log('\n--- SECTION B: ACTUAL NEXT.JS ROUTE HANDLERS (LEVEL B) ---');

    // TEST 14: Direct invocation of protected GET route without cookies/session
    console.log('[TEST 14] Direct invocation of GET /api/events/[eventId]/settings without session cookies...');
    const getReq = new NextRequest(`http://localhost:3000/api/events/${eventA1Id}/settings`);
    const getRes = await getSettingsRoute(getReq, { params: { eventId: eventA1Id } });
    const getResJson = await getRes.json();
    assert(
      getRes.status === 401 && getResJson.code === 'UNAUTHENTICATED',
      'Direct call to protected GET settings route without cookies returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 15: Direct invocation of protected POST route without cookies/session
    console.log('[TEST 15] Direct invocation of POST /api/events/[eventId]/settings without session cookies...');
    const postReq = new NextRequest(`http://localhost:3000/api/events/${eventA1Id}/settings`, {
      method: 'POST',
      body: JSON.stringify({ key: 'badge_template', value: 'standard_v2' }),
      headers: { 'content-type': 'application/json' },
    });
    const postRes = await postSettingsRoute(postReq, { params: { eventId: eventA1Id } });
    const postResJson = await postRes.json();
    assert(
      postRes.status === 401 && postResJson.code === 'UNAUTHENTICATED',
      'Direct call to protected POST settings route without cookies returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // CLEANUP
    console.log('\n[CLEANUP] Cleaning up test records...');
    await db.delete(auditEvents).where(sql`${auditEvents.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(eventStaffAssignments).where(sql`${eventStaffAssignments.eventId} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(events).where(sql`${events.id} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(organizationMembers).where(sql`${organizationMembers.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(platformAdministrators).where(eq(platformAdministrators.userId, userPlatformAdmin.id));
    console.log('✓ All Stage 2 test artifacts cleaned up cleanly.');

  } catch (error) {
    console.error('\nUnexpected failure during Stage 2 test execution:', error);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`STAGE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2Tests();
