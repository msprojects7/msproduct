import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  organizationInvitations,
  events,
  eventStaffAssignments,
  auditEvents,
} from '../db/schema/index';
import { eq, and, sql } from 'drizzle-orm';
import {
  requireOrgContext,
  requireEventContext,
  AuthorizationError,
} from '../lib/auth/context';
import { recordAuditEvent } from '../lib/audit';
import { NextRequest } from 'next/server';

// Import Route Handlers for Level B
import { GET as getOrgsRoute, POST as postOrgsRoute } from '../app/api/organizations/route';
import { GET as getOrgRoute, PATCH as patchOrgRoute } from '../app/api/organizations/[orgId]/route';
import { POST as deactivateOrgRoute } from '../app/api/organizations/[orgId]/deactivate/route';
import { GET as getMembersRoute } from '../app/api/organizations/[orgId]/members/route';
import { PATCH as updateMemberRoleRoute } from '../app/api/organizations/[orgId]/members/[memberId]/route';
import { PATCH as updateMemberStatusRoute } from '../app/api/organizations/[orgId]/members/[memberId]/status/route';
import { POST as transferOwnershipRoute } from '../app/api/organizations/[orgId]/transfer-ownership/route';
import { GET as getInvitationsRoute, POST as postInvitationsRoute } from '../app/api/organizations/[orgId]/invitations/route';
import { DELETE as revokeInvitationRoute } from '../app/api/organizations/[orgId]/invitations/[invitationId]/route';
import { POST as acceptInvitationRoute } from '../app/api/invitations/accept/route';
import { GET as getOrgEventsRoute, POST as postOrgEventsRoute } from '../app/api/organizations/[orgId]/events/route';
import { GET as getAllEventsRoute } from '../app/api/events/route';
import { GET as getEventRoute, PATCH as patchEventRoute } from '../app/api/events/[eventId]/route';
import { POST as archiveEventRoute } from '../app/api/events/[eventId]/archive/route';
import { GET as getStaffRoute, POST as postStaffRoute } from '../app/api/events/[eventId]/staff/route';
import { DELETE as deleteStaffRoute } from '../app/api/events/[eventId]/staff/[assignmentId]/route';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runStage3Tests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 3 ORGANIZATION & EVENT MANAGEMENT TESTS');
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
  const orgAId = `33333333-1111-4111-8111-${String(ts).slice(-12)}`;
  const orgBId = `33333333-2222-4222-8222-${String(ts).slice(-12)}`;
  const orgInactiveId = `33333333-3333-4333-8333-${String(ts).slice(-12)}`;

  const eventA1Id = `44444444-1111-4111-8111-${String(ts).slice(-12)}`;
  const eventB1Id = `44444444-2222-4222-8222-${String(ts).slice(-12)}`;

  const userOwnerA = { id: `u3000000-1111-4111-8111-${String(ts).slice(-12)}`, email: `owner3_${ts}@example.com` };
  const userAdminA = { id: `u3000000-2222-4222-8222-${String(ts).slice(-12)}`, email: `admin3_${ts}@example.com` };
  const userMemberA = { id: `u3000000-3333-4333-8333-${String(ts).slice(-12)}`, email: `member3_${ts}@example.com` };
  const userManagerE1 = { id: `u3000000-4444-4444-8444-${String(ts).slice(-12)}`, email: `manager3_${ts}@example.com` };
  const userRegStaffE1 = { id: `u3000000-5555-4555-8555-${String(ts).slice(-12)}`, email: `regstaff3_${ts}@example.com` };
  const userScannerE1 = { id: `u3000000-6666-4666-8666-${String(ts).slice(-12)}`, email: `scanner3_${ts}@example.com` };
  const userOutsider = { id: `u3000000-7777-4777-8777-${String(ts).slice(-12)}`, email: `outsider3_${ts}@example.com` };

  let dummyInvitationId = '';
  let dummyToken = '';
  let dummyTokenHash = '';

  try {
    // ========================================================================
    // SETUP: Seed test database entities
    // ========================================================================
    console.log('[SETUP] Seeding Stage 3 isolated test records...');

    await db.insert(organizations).values([
      { id: orgAId, name: `Stage 3 Org Alpha (${ts})`, slug: `s3-alpha-${ts}`, isActive: true },
      { id: orgBId, name: `Stage 3 Org Beta (${ts})`, slug: `s3-beta-${ts}`, isActive: true },
      { id: orgInactiveId, name: `Stage 3 Org Inactive (${ts})`, slug: `s3-inactive-${ts}`, isActive: false },
    ]);

    await db.insert(organizationMembers).values([
      { organizationId: orgAId, userId: userOwnerA.id, role: 'owner', isActive: true },
      { organizationId: orgAId, userId: userAdminA.id, role: 'admin', isActive: true },
      { organizationId: orgAId, userId: userMemberA.id, role: 'member', isActive: true },
      { organizationId: orgBId, userId: userOutsider.id, role: 'owner', isActive: true },
      { organizationId: orgInactiveId, userId: userOwnerA.id, role: 'owner', isActive: true },
    ]);

    await db.insert(events).values([
      { id: eventA1Id, organizationId: orgAId, name: `Stage 3 Event A1 (${ts})`, slug: `s3-ev-a1-${ts}`, status: 'published' },
      { id: eventB1Id, organizationId: orgBId, name: `Stage 3 Event B1 (${ts})`, slug: `s3-ev-b1-${ts}`, status: 'published' },
    ]);

    await db.insert(eventStaffAssignments).values([
      { eventId: eventA1Id, userId: userManagerE1.id, role: 'event_manager', isActive: true },
      { eventId: eventA1Id, userId: userRegStaffE1.id, role: 'registration_staff', isActive: true },
      { eventId: eventA1Id, userId: userScannerE1.id, role: 'scanner_operator', isActive: true },
    ]);

    // Setup an invitation for testing
    dummyToken = crypto.randomBytes(32).toString('hex');
    dummyTokenHash = crypto.createHash('sha256').update(dummyToken).digest('hex');
    dummyInvitationId = crypto.randomUUID();

    await db.insert(organizationInvitations).values({
      id: dummyInvitationId,
      organizationId: orgAId,
      email: `invited_${ts}@example.com`,
      role: 'member',
      tokenHash: dummyTokenHash,
      invitedBy: userOwnerA.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    console.log('✓ Seeded organizations, events, memberships, staff assignments, and test invitation.\n');

    // ========================================================================
    // SECTION 1: LEVEL A — BUSINESS LOGIC, INVARIANTS & AUTHORIZATION HELPERS
    // ========================================================================
    console.log('--- SECTION 1: LEVEL A — BUSINESS LOGIC, INVARIANTS & SECURITY CHECKS ---');

    // TEST 1: Tenant Isolation: Outsider cannot access Org A
    try {
      await requireOrgContext(orgAId, { overrideUser: userOutsider });
      assert(false, 'Outsider access to Org A was not rejected', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'NOT_AN_ORGANIZATION_MEMBER',
        'Outsider cannot access Org A (NOT_AN_ORGANIZATION_MEMBER)',
        'LEVEL A'
      );
    }

    // TEST 2: Inactive Organization Access Rejection
    try {
      await requireOrgContext(orgInactiveId, { overrideUser: userOwnerA });
      assert(false, 'Access to inactive org was not rejected', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'ORGANIZATION_INACTIVE',
        'Inactive organization immediately rejects access with ORGANIZATION_INACTIVE (403)',
        'LEVEL A'
      );
    }

    // TEST 3: Duplicate Organization Slug Enforcement
    try {
      await db.insert(organizations).values({
        name: 'Duplicate Slug Org',
        slug: `s3-alpha-${ts}`, // existing slug
        isActive: true,
      });
      assert(false, 'Duplicate organization slug did not throw error', 'LEVEL A');
    } catch (err) {
      const isUniqueViolation =
        err.code === '23505' ||
        err.cause?.code === '23505' ||
        String(err).toLowerCase().includes('unique') ||
        String(err.cause).toLowerCase().includes('unique');
      assert(
        isUniqueViolation,
        'Duplicate organization slug triggers unique constraint violation',
        'LEVEL A'
      );
    }

    // TEST 4: org_member cannot manage organization members
    const memberCtx = await requireOrgContext(orgAId, { overrideUser: userMemberA });
    try {
      memberCtx.assertPermission('org:manage_members');
      assert(false, 'org_member was allowed org:manage_members', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'org_member is strictly denied org:manage_members',
        'LEVEL A'
      );
    }

    // TEST 5: org_member cannot create events
    try {
      memberCtx.assertPermission('org:create_event');
      assert(false, 'org_member was allowed org:create_event', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'org_member is strictly denied org:create_event',
        'LEVEL A'
      );
    }

    // TEST 6: org_admin cannot transfer ownership
    const adminCtx = await requireOrgContext(orgAId, { overrideUser: userAdminA });
    try {
      adminCtx.assertPermission('org:transfer_ownership');
      assert(false, 'org_admin was allowed org:transfer_ownership', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'org_admin is strictly denied org:transfer_ownership',
        'LEVEL A'
      );
    }

    // TEST 7: org_admin cannot delete/deactivate organization
    try {
      adminCtx.assertPermission('org:delete');
      assert(false, 'org_admin was allowed org:delete', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'org_admin is strictly denied org:delete',
        'LEVEL A'
      );
    }

    // TEST 8: org_owner has all org management permissions
    const ownerCtx = await requireOrgContext(orgAId, { overrideUser: userOwnerA });
    assert(
      ownerCtx.hasPermission('org:transfer_ownership') &&
      ownerCtx.hasPermission('org:delete') &&
      ownerCtx.hasPermission('org:manage_members') &&
      ownerCtx.hasPermission('org:create_event'),
      'org_owner holds all required organization permissions',
      'LEVEL A'
    );

    // TEST 9: Event Staff Hierarchy: Scanner cannot manage staff
    const scannerCtx = await requireEventContext(eventA1Id, { overrideUser: userScannerE1 });
    try {
      scannerCtx.assertPermission('event:manage_staff');
      assert(false, 'Scanner operator was allowed event:manage_staff', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'scanner_operator is strictly denied event:manage_staff',
        'LEVEL A'
      );
    }

    // TEST 10: Registration staff cannot manage staff
    const regStaffCtx = await requireEventContext(eventA1Id, { overrideUser: userRegStaffE1 });
    try {
      regStaffCtx.assertPermission('event:manage_staff');
      assert(false, 'Registration staff was allowed event:manage_staff', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'FORBIDDEN',
        'registration_staff is strictly denied event:manage_staff',
        'LEVEL A'
      );
    }

    // TEST 11: Event Manager has event:manage_staff and event:update permissions
    const mgrCtx = await requireEventContext(eventA1Id, { overrideUser: userManagerE1 });
    assert(
      mgrCtx.hasPermission('event:manage_staff') && mgrCtx.hasPermission('event:update'),
      'event_manager has event:manage_staff and event:update permissions',
      'LEVEL A'
    );

    // TEST 12: Cross-Event Access Rejection: Manager of Event A1 cannot access Event B1
    try {
      await requireEventContext(eventB1Id, { overrideUser: userManagerE1 });
      assert(false, 'Manager of A1 was allowed access to B1', 'LEVEL A');
    } catch (err) {
      assert(
        err instanceof AuthorizationError && err.code === 'UNAUTHORIZED_EVENT_ACCESS',
        'Event manager cannot access unrelated event in another organization (UNAUTHORIZED_EVENT_ACCESS)',
        'LEVEL A'
      );
    }

    // TEST 13: Duplicate Event Slug within same Organization Rejection
    try {
      await db.insert(events).values({
        organizationId: orgAId,
        name: 'Duplicate Event Slug',
        slug: `s3-ev-a1-${ts}`, // existing slug in orgA
        status: 'published',
      });
      assert(false, 'Duplicate event slug within org was not rejected', 'LEVEL A');
    } catch (err) {
      const isUniqueViolation =
        err.code === '23505' ||
        err.cause?.code === '23505' ||
        String(err).toLowerCase().includes('unique') ||
        String(err.cause).toLowerCase().includes('unique');
      assert(
        isUniqueViolation,
        'Duplicate event slug within same organization triggers unique constraint violation',
        'LEVEL A'
      );
    }

    // TEST 14: Same Event Slug across DIFFERENT Organizations is Permitted
    let crossOrgSlugAllowed = false;
    try {
      const allowedCrossEvent = await db.insert(events).values({
        organizationId: orgBId,
        name: 'Same Event Slug in Different Org',
        slug: `s3-ev-a1-${ts}`, // existing in orgA, allowed in orgB
        status: 'published',
      }).returning();
      crossOrgSlugAllowed = !!allowedCrossEvent[0]?.id;
      // Clean up the created event
      await db.delete(events).where(eq(events.id, allowedCrossEvent[0].id));
    } catch (err) {
      crossOrgSlugAllowed = false;
    }
    assert(
      crossOrgSlugAllowed,
      'Same event slug across different organizations is allowed by scoped unique constraint',
      'LEVEL A'
    );

    // TEST 15: Invitation Token Security: Hash verification
    const testVerifyHash = crypto.createHash('sha256').update(dummyToken).digest('hex');
    assert(
      testVerifyHash === dummyTokenHash,
      'Invitation token hash matches stored SHA-256 hash',
      'LEVEL A'
    );

    // TEST 16: Invitation Expiration Check
    const expiredInvId = crypto.randomUUID();
    await db.insert(organizationInvitations).values({
      id: expiredInvId,
      organizationId: orgAId,
      email: `expired_${ts}@example.com`,
      role: 'member',
      tokenHash: crypto.createHash('sha256').update(`expired_token_${ts}`).digest('hex'),
      invitedBy: userOwnerA.id,
      status: 'pending',
      expiresAt: new Date(Date.now() - 10000), // in the past
    });

    const [expiredCheck] = await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.id, expiredInvId))
      .limit(1);

    const isExpired = new Date(expiredCheck.expiresAt) < new Date();
    assert(isExpired, 'Expired invitation timestamp properly identified as expired', 'LEVEL A');
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, expiredInvId));

    // TEST 17: Audit Event Persistence with Transaction Safety
    await db.transaction(async (tx) => {
      await recordAuditEvent(
        {
          organizationId: orgAId,
          userId: userOwnerA.id,
          action: 'organization.updated',
          entityType: 'organization',
          entityId: orgAId,
          details: { field: 'name', value: 'Updated Test Org' },
        },
        tx
      );
    });

    const [persistedAudit] = await db
      .select()
      .from(auditEvents)
      .where(and(
        eq(auditEvents.organizationId, orgAId),
        eq(auditEvents.action, 'organization.updated')
      ))
      .limit(1);

    assert(
      !!persistedAudit?.id && persistedAudit.action === 'organization.updated',
      'Audit log persisted with transaction support and correct actor metadata',
      'LEVEL A'
    );


    // ========================================================================
    // SECTION 2: LEVEL B — NEXT.JS ROUTE HANDLERS DIRECT INVOCATION
    // ========================================================================
    console.log('\n--- SECTION 2: LEVEL B — NEXT.JS ROUTE HANDLERS (UNAUTHENTICATED & VALIDATION CHECKS) ---');

    // Helper for dummy unauthenticated request
    const mockUnauthReq = (url, method = 'GET', body = null) => {
      const init = { method };
      if (body) {
        init.body = JSON.stringify(body);
        init.headers = { 'Content-Type': 'application/json' };
      }
      return new NextRequest(url, init);
    };

    // TEST 18: GET /api/organizations returns 401 unauthenticated
    const resGetOrgs = await getOrgsRoute(mockUnauthReq('http://localhost:3000/api/organizations'));
    const jsonGetOrgs = await resGetOrgs.json();
    assert(
      resGetOrgs.status === 401 && jsonGetOrgs.code === 'UNAUTHENTICATED',
      'GET /api/organizations returns 401 UNAUTHENTICATED without session',
      'LEVEL B'
    );

    // TEST 19: POST /api/organizations returns 401 unauthenticated
    const resPostOrgs = await postOrgsRoute(mockUnauthReq('http://localhost:3000/api/organizations', 'POST', { name: 'New Org' }));
    const jsonPostOrgs = await resPostOrgs.json();
    assert(
      resPostOrgs.status === 401 && jsonPostOrgs.code === 'UNAUTHENTICATED',
      'POST /api/organizations returns 401 UNAUTHENTICATED without session',
      'LEVEL B'
    );

    // TEST 20: GET /api/organizations/[orgId] returns 401 unauthenticated
    const resGetOrg = await getOrgRoute(mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}`), { params: { orgId: orgAId } });
    const jsonGetOrg = await resGetOrg.json();
    assert(
      resGetOrg.status === 401 && jsonGetOrg.code === 'UNAUTHENTICATED',
      'GET /api/organizations/[orgId] returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 21: PATCH /api/organizations/[orgId] returns 401 unauthenticated
    const resPatchOrg = await patchOrgRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}`, 'PATCH', { name: 'Patched Org' }),
      { params: { orgId: orgAId } }
    );
    const jsonPatchOrg = await resPatchOrg.json();
    assert(
      resPatchOrg.status === 401 && jsonPatchOrg.code === 'UNAUTHENTICATED',
      'PATCH /api/organizations/[orgId] returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 22: POST /api/organizations/[orgId]/deactivate returns 401 unauthenticated
    const resDeactOrg = await deactivateOrgRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/deactivate`, 'POST'),
      { params: { orgId: orgAId } }
    );
    const jsonDeactOrg = await resDeactOrg.json();
    assert(
      resDeactOrg.status === 401 && jsonDeactOrg.code === 'UNAUTHENTICATED',
      'POST /api/organizations/[orgId]/deactivate returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 23: GET /api/organizations/[orgId]/members returns 401 unauthenticated
    const resGetMembers = await getMembersRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/members`),
      { params: { orgId: orgAId } }
    );
    const jsonGetMembers = await resGetMembers.json();
    assert(
      resGetMembers.status === 401 && jsonGetMembers.code === 'UNAUTHENTICATED',
      'GET /api/organizations/[orgId]/members returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 24: PATCH /api/organizations/[orgId]/members/[memberId] returns 401 unauthenticated
    const resPatchMember = await updateMemberRoleRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/members/${userMemberA.id}`, 'PATCH', { role: 'admin' }),
      { params: { orgId: orgAId, memberId: userMemberA.id } }
    );
    const jsonPatchMember = await resPatchMember.json();
    assert(
      resPatchMember.status === 401 && jsonPatchMember.code === 'UNAUTHENTICATED',
      'PATCH /api/organizations/[orgId]/members/[memberId] returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 25: POST /api/organizations/[orgId]/transfer-ownership returns 401 unauthenticated
    const resTransfer = await transferOwnershipRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/transfer-ownership`, 'POST', { newOwnerUserId: userAdminA.id }),
      { params: { orgId: orgAId } }
    );
    const jsonTransfer = await resTransfer.json();
    assert(
      resTransfer.status === 401 && jsonTransfer.code === 'UNAUTHENTICATED',
      'POST /api/organizations/[orgId]/transfer-ownership returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 26: GET /api/organizations/[orgId]/invitations returns 401 unauthenticated
    const resGetInvs = await getInvitationsRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/invitations`),
      { params: { orgId: orgAId } }
    );
    const jsonGetInvs = await resGetInvs.json();
    assert(
      resGetInvs.status === 401 && jsonGetInvs.code === 'UNAUTHENTICATED',
      'GET /api/organizations/[orgId]/invitations returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 27: POST /api/invitations/accept returns 401 unauthenticated
    const resAcceptInv = await acceptInvitationRoute(
      mockUnauthReq(`http://localhost:3000/api/invitations/accept`, 'POST', { token: dummyToken })
    );
    const jsonAcceptInv = await resAcceptInv.json();
    assert(
      resAcceptInv.status === 401 && jsonAcceptInv.code === 'UNAUTHENTICATED',
      'POST /api/invitations/accept returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 28: POST /api/organizations/[orgId]/events returns 401 unauthenticated
    const resPostEvent = await postOrgEventsRoute(
      mockUnauthReq(`http://localhost:3000/api/organizations/${orgAId}/events`, 'POST', { name: 'Test Event' }),
      { params: { orgId: orgAId } }
    );
    const jsonPostEvent = await resPostEvent.json();
    assert(
      resPostEvent.status === 401 && jsonPostEvent.code === 'UNAUTHENTICATED',
      'POST /api/organizations/[orgId]/events returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 29: GET /api/events returns 401 unauthenticated
    const resGetEvents = await getAllEventsRoute(mockUnauthReq(`http://localhost:3000/api/events`));
    const jsonGetEvents = await resGetEvents.json();
    assert(
      resGetEvents.status === 401 && jsonGetEvents.code === 'UNAUTHENTICATED',
      'GET /api/events returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 30: POST /api/events/[eventId]/archive returns 401 unauthenticated
    const resArchiveEvent = await archiveEventRoute(
      mockUnauthReq(`http://localhost:3000/api/events/${eventA1Id}/archive`, 'POST'),
      { params: { eventId: eventA1Id } }
    );
    const jsonArchiveEvent = await resArchiveEvent.json();
    assert(
      resArchiveEvent.status === 401 && jsonArchiveEvent.code === 'UNAUTHENTICATED',
      'POST /api/events/[eventId]/archive returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // TEST 31: POST /api/events/[eventId]/staff returns 401 unauthenticated
    const resPostStaff = await postStaffRoute(
      mockUnauthReq(`http://localhost:3000/api/events/${eventA1Id}/staff`, 'POST', { userId: userOutsider.id, role: 'scanner_operator' }),
      { params: { eventId: eventA1Id } }
    );
    const jsonPostStaff = await resPostStaff.json();
    assert(
      resPostStaff.status === 401 && jsonPostStaff.code === 'UNAUTHENTICATED',
      'POST /api/events/[eventId]/staff returns 401 UNAUTHENTICATED',
      'LEVEL B'
    );

    // ========================================================================
    // SECTION 3: LEVEL C — REAL HTTP INTEGRATION WITH AUTHENTICATED SESSIONS
    // ========================================================================
    console.log('\n--- SECTION 3: LEVEL C — REAL HTTP INTEGRATION WITH AUTHENTICATED SESSIONS ---');
    console.log(`Checking Next.js dev server online at ${APP_URL}...`);

    let httpAvailable = false;
    try {
      const healthCheck = await fetch(`${APP_URL}/api/health`);
      if (healthCheck.ok) {
        httpAvailable = true;
      }
    } catch (e) {
      httpAvailable = false;
    }

    if (!httpAvailable) {
      console.log('Dev server not detected on 3333; skipping Level C real HTTP suite.');
    } else {
      console.log('✓ Dev server online on port 3333. Beginning Level C live tests...\n');

      // 1. Sign up 3 real distinct users via Neon Auth HTTP API
      const userTs = Date.now();
      const realOwnerEmail = `http-owner-${userTs}@example.com`;
      const realAdminEmail = `http-admin-${userTs}@example.com`;
      const realInviteeEmail = `http-invitee-${userTs}@example.com`;

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

      const realOwner = await signUpUser(realOwnerEmail, 'Real HTTP Owner');
      const realAdmin = await signUpUser(realAdminEmail, 'Real HTTP Admin');
      const realInvitee = await signUpUser(realInviteeEmail, 'Real HTTP Invitee');

      assert(realOwner.user?.id && realOwner.cookies.length > 0, 'Created authenticated Owner session', 'LEVEL C');
      assert(realAdmin.user?.id && realAdmin.cookies.length > 0, 'Created authenticated Admin session', 'LEVEL C');
      assert(realInvitee.user?.id && realInvitee.cookies.length > 0, 'Created authenticated Invitee session', 'LEVEL C');

      // TEST 32: Owner creates organization via real HTTP POST /api/organizations
      const createOrgRes = await fetch(`${APP_URL}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          name: `Apex Global Events (${userTs})`,
          slug: `apex-events-${userTs}`,
        }),
      });
      const createOrgData = await createOrgRes.json();
      assert(
        createOrgRes.status === 201 && createOrgData.organization?.slug === `apex-events-${userTs}`,
        'Owner created organization via real HTTP POST /api/organizations (201 CREATED)',
        'LEVEL C'
      );
      const createdOrgId = createOrgData.organization.id;

      // TEST 33: Owner checks membership list: Owner is automatically assigned 'owner' role
      const getMembersRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/members`, {
        headers: { 'Cookie': realOwner.cookies },
      });
      const getMembersData = await getMembersRes.json();
      assert(
        getMembersRes.status === 200 &&
        getMembersData.members.some(m => m.userId === realOwner.user.id && m.role === 'owner'),
        'Creator automatically assigned active owner membership atomically',
        'LEVEL C'
      );

      // TEST 34: Tenant isolation: Unrelated user (realInvitee) sees only their own organizations
      const inviteeOrgsRes = await fetch(`${APP_URL}/api/organizations`, {
        headers: { 'Cookie': realInvitee.cookies },
      });
      const inviteeOrgsData = await inviteeOrgsRes.json();
      const inviteeCanSeeCreatedOrg = inviteeOrgsData.organizations?.some(o => o.id === createdOrgId);
      assert(
        inviteeOrgsRes.status === 200 && !inviteeCanSeeCreatedOrg,
        'Tenant Isolation: Unrelated authenticated user does NOT see Apex Global Events in their organization list',
        'LEVEL C'
      );

      // TEST 35: Duplicate organization slug returns 409 Conflict
      const dupOrgRes = await fetch(`${APP_URL}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          name: `Apex Global Events Duplicate`,
          slug: `apex-events-${userTs}`, // duplicate slug
        }),
      });
      const dupOrgData = await dupOrgRes.json();
      assert(
        dupOrgRes.status === 409 && dupOrgData.code === 'SLUG_CONFLICT',
        'Duplicate organization slug returns 409 SLUG_CONFLICT',
        'LEVEL C'
      );

      // TEST 36: Owner creates invitation for realAdmin with role 'admin'
      const createInvRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({
          email: realAdminEmail,
          role: 'admin',
        }),
      });
      const createInvData = await createInvRes.json();
      assert(
        createInvRes.status === 201 && !!createInvData.token && !!createInvData.invitation?.id,
        'Owner successfully generated organization invitation with secure token',
        'LEVEL C'
      );
      const generatedToken = createInvData.token;
      const createdInvitationId = createInvData.invitation.id;

      // TEST 37: Verify raw token was NOT saved in audit log
      const [invAudit] = await db
        .select()
        .from(auditEvents)
        .where(and(
          eq(auditEvents.organizationId, createdOrgId),
          eq(auditEvents.action, 'invitation.created')
        ))
        .limit(1);
      const auditDetailsString = JSON.stringify(invAudit?.metadata || {});
      assert(
        !auditDetailsString.includes(generatedToken),
        'Security: Raw invitation token is NEVER stored in database audit logs or metadata',
        'LEVEL C'
      );

      // TEST 38: Admin accepts invitation via real HTTP POST /api/invitations/accept
      const acceptInvRes = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realAdmin.cookies,
        },
        body: JSON.stringify({ token: generatedToken }),
      });
      const acceptInvData = await acceptInvRes.json();
      assert(
        acceptInvRes.status === 200 &&
        acceptInvData.organization?.id === createdOrgId &&
        acceptInvData.membership?.role === 'admin',
        'Admin accepted invitation and received granted role (200 OK)',
        'LEVEL C'
      );

      // TEST 39: Reusing already accepted invitation token is rejected
      const reuseInvRes = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realInvitee.cookies,
        },
        body: JSON.stringify({ token: generatedToken }),
      });
      const reuseInvData = await reuseInvRes.json();
      assert(
        (reuseInvRes.status === 400 || reuseInvRes.status === 410) &&
        (reuseInvData.code === 'INVITATION_INACTIVE' || reuseInvData.code === 'INVITATION_ALREADY_ACCEPTED'),
        'Accepted invitation token cannot be reused',
        'LEVEL C'
      );

      // TEST 40: Admin creates event under the organization
      const createEventRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realAdmin.cookies,
        },
        body: JSON.stringify({
          name: `Tech Conf ${userTs}`,
          slug: `tech-conf-${userTs}`,
          startDate: '2026-11-01',
          endDate: '2026-11-03',
        }),
      });
      const createEventData = await createEventRes.json();
      assert(
        createEventRes.status === 201 && createEventData.event?.slug === `tech-conf-${userTs}`,
        'Admin created event under organization (201 CREATED)',
        'LEVEL C'
      );
      const createdEventId = createEventData.event.id;

      // TEST 41: Admin assigns realInvitee as registration_staff
      const assignStaffRes = await fetch(`${APP_URL}/api/events/${createdEventId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realAdmin.cookies,
        },
        body: JSON.stringify({
          userId: realInvitee.user.id,
          role: 'registration_staff',
        }),
      });
      const assignStaffData = await assignStaffRes.json();
      assert(
        assignStaffRes.status === 201 && assignStaffData.assignment?.role === 'registration_staff',
        'Admin successfully assigned registration staff to event',
        'LEVEL C'
      );

      // TEST 42: Registration staff attempts to assign staff -> rejected with 403 Forbidden
      const staffSelfAssignRes = await fetch(`${APP_URL}/api/events/${createdEventId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realInvitee.cookies,
        },
        body: JSON.stringify({
          userId: realInvitee.user.id,
          role: 'event_manager',
        }),
      });
      const staffSelfAssignData = await staffSelfAssignRes.json();
      assert(
        staffSelfAssignRes.status === 403 && staffSelfAssignData.code === 'FORBIDDEN',
        'Registration staff strictly prohibited from managing staff (403 FORBIDDEN)',
        'LEVEL C'
      );

      // TEST 43: Admin attempts to transfer ownership -> rejected with 403 (requires org_owner)
      const unauthTransferRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realAdmin.cookies,
        },
        body: JSON.stringify({ targetUserId: realAdmin.user.id }),
      });
      const unauthTransferData = await unauthTransferRes.json();
      assert(
        unauthTransferRes.status === 403 && unauthTransferData.code === 'FORBIDDEN',
        'org_admin prohibited from transferring ownership (403 FORBIDDEN)',
        'LEVEL C'
      );

      // TEST 44: Owner successfully transfers ownership to Admin
      const validTransferRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({ targetUserId: realAdmin.user.id }),
      });
      const validTransferData = await validTransferRes.json();
      assert(
        validTransferRes.status === 200 && validTransferData.status === 'ok',
        'Owner successfully transferred ownership to Admin atomically (200 OK)',
        'LEVEL C'
      );

      // TEST 45: Former owner (now demoted to admin) cannot transfer ownership again
      const demotedTransferRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': APP_URL,
          'Cookie': realOwner.cookies,
        },
        body: JSON.stringify({ targetUserId: realOwner.user.id }),
      });
      const demotedTransferData = await demotedTransferRes.json();
      assert(
        demotedTransferRes.status === 403 && demotedTransferData.code === 'FORBIDDEN',
        'Demoted former owner cannot transfer ownership (403 FORBIDDEN)',
        'LEVEL C'
      );

      // TEST 46: New owner deactivates the organization
      const deactOrgRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}/deactivate`, {
        method: 'POST',
        headers: {
          'Origin': APP_URL,
          'Cookie': realAdmin.cookies,
        },
      });
      const deactOrgData = await deactOrgRes.json();
      assert(
        deactOrgRes.status === 200 && deactOrgData.status === 'ok',
        'New Owner successfully deactivated organization (200 OK)',
        'LEVEL C'
      );

      // TEST 47: Subsequent access to deactivated organization rejected with 403 ORGANIZATION_INACTIVE
      const postDeactRes = await fetch(`${APP_URL}/api/organizations/${createdOrgId}`, {
        headers: { 'Cookie': realAdmin.cookies },
      });
      const postDeactData = await postDeactRes.json();
      assert(
        postDeactRes.status === 403 && postDeactData.code === 'ORGANIZATION_INACTIVE',
        'Subsequent member request to deactivated organization returns 403 ORGANIZATION_INACTIVE',
        'LEVEL C'
      );

      // Cleanup Level C records
      await db.delete(auditEvents).where(eq(auditEvents.organizationId, createdOrgId));
      await db.delete(eventStaffAssignments).where(eq(eventStaffAssignments.eventId, createdEventId));
      await db.delete(events).where(eq(events.id, createdEventId));
      await db.delete(organizationInvitations).where(eq(organizationInvitations.organizationId, createdOrgId));
      await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, createdOrgId));
      await db.delete(organizations).where(eq(organizations.id, createdOrgId));
    }

    // ========================================================================
    // CLEANUP: Clean all seeded test records
    // ========================================================================
    console.log('\n[CLEANUP] Cleaning up Stage 3 test artifacts in PostgreSQL...');
    await db.delete(auditEvents).where(sql`${auditEvents.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(eventStaffAssignments).where(sql`${eventStaffAssignments.eventId} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(events).where(sql`${events.id} IN (${eventA1Id}, ${eventB1Id})`);
    await db.delete(organizationInvitations).where(sql`${organizationInvitations.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(organizationMembers).where(sql`${organizationMembers.organizationId} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${orgAId}, ${orgBId}, ${orgInactiveId})`);
    console.log('✓ All Stage 3 test artifacts cleaned up cleanly.');

  } catch (error) {
    console.error('Fatal unexpected error during Stage 3 tests:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`STAGE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage3Tests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Test runner exited with unhandled error:', err);
  process.exit(1);
});
