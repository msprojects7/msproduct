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
  requirePlatformAdminContext,
  AuthorizationError,
} from '../lib/auth/context';
import { eq, sql } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runSessionRevocationTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 2 SESSION REVOCATION & TIMING EXPERIMENTS');
  console.log(`Target Server: ${APP_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  const ts = Date.now();
  const orgId = `a7777777-1111-4111-8111-${String(ts).slice(-12)}`;
  const eventId = `e7777777-1111-4111-8111-${String(ts).slice(-12)}`;
  const adminId = `u7777777-9999-4999-8999-${String(ts).slice(-12)}`;

  let testUser = null;
  let activeCookies = '';

  try {
    // -------------------------------------------------------------------------
    // EXPERIMENT 1: Sign-in creates a valid session
    // -------------------------------------------------------------------------
    console.log('[EXPERIMENT 1] Testing Sign-in session creation...');
    const userEmail = `revoc-test-${ts}@example.com`;
    const userPassword = 'Password123!@#Test';

    // Sign up initial user
    const signUpRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: userEmail, password: userPassword, name: 'Revocation Subject' }),
    });
    const signUpJson = await signUpRes.json();
    testUser = signUpJson.user;
    activeCookies = signUpRes.headers.get('set-cookie') || '';
    assert(signUpRes.status === 200 && testUser?.id, 'Sign-up completed with user record created');

    // Test Sign-in with the credentials
    const signInRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const signInCookies = signInRes.headers.get('set-cookie') || '';
    assert(signInRes.status === 200, 'Sign-in endpoint returned 200 OK');
    assert(signInCookies.includes('session_token') || activeCookies.includes('session_token'), 'Session token cookie successfully minted');

    // Verify session validity via /api/auth/get-session
    const getSessionRes = await fetch(`${APP_URL}/api/auth/get-session`, {
      headers: { 'Cookie': activeCookies },
    });
    const sessionJson = await getSessionRes.json();
    assert(
      getSessionRes.status === 200 && sessionJson?.user?.id === testUser.id,
      'Active session verified via /api/auth/get-session'
    );

    // -------------------------------------------------------------------------
    // EXPERIMENT 2: Sign-out prevents subsequent protected API access
    // -------------------------------------------------------------------------
    console.log('\n[EXPERIMENT 2] Testing Sign-out cookie clearance & API prevention...');

    // Seed tenant and event
    await db.insert(organizations).values([
      { id: orgId, name: `Revoc Org (${ts})`, slug: `revoc-org-${ts}`, isActive: true },
    ]);
    await db.insert(events).values([
      { id: eventId, organizationId: orgId, name: `Revoc Event (${ts})`, slug: `revoc-event-${ts}`, status: 'published' },
    ]);
    await db.insert(organizationMembers).values([
      { organizationId: orgId, userId: testUser.id, role: 'owner', isActive: true },
    ]);

    // Access before sign-out: should succeed
    const beforeSignOutRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': activeCookies },
    });
    assert(beforeSignOutRes.status === 200, 'Protected API accessible prior to sign-out (200 OK)');

    // Call Sign-out
    const signOutRes = await fetch(`${APP_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': activeCookies },
      body: JSON.stringify({}),
    });
    const signOutCookies = signOutRes.headers.get('set-cookie') || '';
    assert(signOutRes.status === 200, 'Sign-out endpoint executed successfully (200 OK)');
    assert(signOutCookies.includes('Max-Age=0'), 'Sign-out set-cookie header explicitly expires session cookies (Max-Age=0)');

    // Access with cleared cookies: must return 401
    const afterSignOutRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': signOutCookies },
    });
    const afterSignOutJson = await afterSignOutRes.json();
    assert(
      afterSignOutRes.status === 401 && afterSignOutJson.code === 'UNAUTHENTICATED',
      'Subsequent API access rejected with 401 UNAUTHENTICATED after sign-out'
    );

    // -------------------------------------------------------------------------
    // EXPERIMENT 3: Upstream session revocation vs local cookie cache timing
    // -------------------------------------------------------------------------
    console.log('\n[EXPERIMENT 3] Investigating Upstream Revocation vs Local Cookie Cache dynamics...');

    // Re-sign in to get fresh cookies
    const reSignInRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const freshCookies = reSignInRes.headers.get('set-cookie') || '';
    assert(reSignInRes.status === 200, 'Obtained fresh session credentials');

    // Sign out to revoke the session upstream
    await fetch(`${APP_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL, 'Cookie': freshCookies },
      body: JSON.stringify({}),
    });

    // Test 3A: Direct query to upstream Neon Auth server with the old revoked cookie
    const upstreamRes = await fetch(`${process.env.NEON_AUTH_BASE_URL}/get-session`, {
      headers: { 'Cookie': freshCookies, 'Origin': APP_URL },
    });
    const upstreamData = await upstreamRes.text();
    assert(
      upstreamRes.status === 200 && (upstreamData === 'null' || upstreamData === ''),
      'Upstream Neon Auth database confirms session is REVOKED (returns null)'
    );

    // Test 3B: Documented local cookie cache window
    console.log('   [DOCUMENTED CACHE WINDOW]');
    console.log('   - Neon Auth SDK sessionDataTtl is set to 300 seconds (5 minutes) in lib/auth/server.ts.');
    console.log('   - The local cookie cache (__Secure-neon-auth.local.session_data) is cleared upon /api/auth/sign-out.');
    console.log('   - If a client withholds the sign-out response and keeps the old local JWT cookie,');
    console.log('     auth.getSession() will accept the cached JWT until its 300s exp timestamp.');

    // -------------------------------------------------------------------------
    // EXPERIMENT 4: Expired session rejection
    // -------------------------------------------------------------------------
    console.log('\n[EXPERIMENT 4] Testing rejection of expired/invalid session cookies...');
    const fakeExpiredCookie = '__Secure-neon-auth.local.session_data=invalid.or.expired.jwt; __Secure-neon-auth.session_token=revoked_token';
    const expiredRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': fakeExpiredCookie },
    });
    const expiredJson = await expiredRes.json();
    assert(
      expiredRes.status === 401 && expiredJson.code === 'UNAUTHENTICATED',
      'Expired/invalid session cookie rejected with 401 UNAUTHENTICATED'
    );

    // -------------------------------------------------------------------------
    // EXPERIMENT 5: Deactivated Platform Administrator loses platform access
    // -------------------------------------------------------------------------
    console.log('\n[EXPERIMENT 5] Testing Platform Administrator deactivation...');
    // Seed platform admin
    await db.delete(platformAdministrators).where(eq(platformAdministrators.userId, adminId));
    await db.insert(platformAdministrators).values({
      userId: adminId,
      email: `admin-${ts}@example.com`,
      isActive: true,
    });

    const activeAdminCheck = await requirePlatformAdminContext({
      overrideUser: { id: adminId, email: `admin-${ts}@example.com` },
    });
    assert(activeAdminCheck.role === 'platform_admin', 'Active platform administrator verified');

    // Deactivate administrator in database
    const startDeactAdmin = performance.now();
    await db
      .update(platformAdministrators)
      .set({ isActive: false })
      .where(eq(platformAdministrators.userId, adminId));

    let adminBlocked = false;
    try {
      await requirePlatformAdminContext({
        overrideUser: { id: adminId, email: `admin-${ts}@example.com` },
      });
    } catch (err) {
      if (err instanceof AuthorizationError && err.code === 'NOT_A_PLATFORM_ADMIN') {
        adminBlocked = true;
      }
    }
    const durationDeactAdmin = (performance.now() - startDeactAdmin).toFixed(2);
    assert(
      adminBlocked,
      `Deactivated platform admin blocked with 403 NOT_A_PLATFORM_ADMIN (enforced in ${durationDeactAdmin}ms)`
    );

    // -------------------------------------------------------------------------
    // EXPERIMENT 6: Immediate database revocation (Organization, Membership, Staff)
    // -------------------------------------------------------------------------
    console.log('\n[EXPERIMENT 6] Testing immediate database authorization revocation (< 1ms delay)...');

    // Re-sign in to get valid active cookies for testUser
    const sessionRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const validCookies = sessionRes.headers.get('set-cookie') || '';

    // Assign testUser as registration staff on eventId
    await db.insert(eventStaffAssignments).values({
      eventId,
      userId: testUser.id,
      role: 'event_manager',
      isActive: true,
    });

    // Verify valid access currently succeeds
    const checkValid = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': validCookies },
    });
    assert(checkValid.status === 200, 'Baseline check: Authorized request returns 200 OK');

    // 6A. Deactivate Staff Assignment
    const t0 = performance.now();
    await db
      .update(eventStaffAssignments)
      .set({ isActive: false })
      .where(and(eq(eventStaffAssignments.eventId, eventId), eq(eventStaffAssignments.userId, testUser.id)));

    // Also update org membership to member so staff assignment is the sole grant
    await db
      .update(organizationMembers)
      .set({ role: 'member' })
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, testUser.id)));

    const staffDeactRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': validCookies },
    });
    const staffDeactJson = await staffDeactRes.json();
    const tStaff = (performance.now() - t0).toFixed(2);
    assert(
      staffDeactRes.status === 403 && staffDeactJson.code === 'ASSIGNMENT_INACTIVE',
      `Staff assignment deactivation immediately blocked access with 403 ASSIGNMENT_INACTIVE (elapsed: ${tStaff}ms)`
    );

    // 6B. Reactivate staff assignment, deactivate Organization Membership
    await db
      .update(eventStaffAssignments)
      .set({ isActive: true })
      .where(and(eq(eventStaffAssignments.eventId, eventId), eq(eventStaffAssignments.userId, testUser.id)));

    const t1 = performance.now();
    await db
      .update(organizationMembers)
      .set({ isActive: false })
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, testUser.id)));

    const memDeactRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': validCookies },
    });
    const memDeactJson = await memDeactRes.json();
    const tMem = (performance.now() - t1).toFixed(2);
    assert(
      memDeactRes.status === 403 && memDeactJson.code === 'MEMBERSHIP_INACTIVE',
      `Organization membership deactivation immediately blocked access with 403 MEMBERSHIP_INACTIVE (elapsed: ${tMem}ms)`
    );

    // 6C. Reactivate membership, deactivate Entire Organization
    await db
      .update(organizationMembers)
      .set({ isActive: true })
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, testUser.id)));

    const t2 = performance.now();
    await db
      .update(organizations)
      .set({ isActive: false })
      .where(eq(organizations.id, orgId));

    const orgDeactRes = await fetch(`${APP_URL}/api/events/${eventId}/settings`, {
      headers: { 'Cookie': validCookies },
    });
    const orgDeactJson = await orgDeactRes.json();
    const tOrg = (performance.now() - t2).toFixed(2);
    assert(
      orgDeactRes.status === 403 && orgDeactJson.code === 'ORGANIZATION_INACTIVE',
      `Organization deactivation immediately blocked access with 403 ORGANIZATION_INACTIVE (elapsed: ${tOrg}ms)`
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n[CLEANUP] Cleaning up test records...');
    await db.delete(eventStaffAssignments).where(eq(eventStaffAssignments.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));
    await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgId));
    await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
    await db.delete(platformAdministrators).where(eq(platformAdministrators.userId, adminId));
    console.log('✓ All test records cleaned up cleanly.');

  } catch (err) {
    console.error('\nUnexpected failure during session revocation experiments:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`SESSION REVOCATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

function and(...conditions) {
  return sql.join(conditions, sql` and `);
}

runSessionRevocationTests();
