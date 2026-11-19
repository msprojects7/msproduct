import dotenv from 'dotenv';
dotenv.config();

import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  eventSettings,
  auditEvents,
} from '../db/schema/index';
import { eq, sql } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runHttpRouteTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — STAGE 2 AUTHENTICATED HTTP ROUTE INTEGRATION TESTS');
  console.log(`Target Server: ${APP_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ [REAL HTTP] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [REAL HTTP] FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Generate unique test entity identifiers
  const ts = Date.now();
  const orgAId = `a8888888-1111-4111-8111-${String(ts).slice(-12)}`;
  const orgBId = `a8888888-2222-4222-8222-${String(ts).slice(-12)}`;
  const eventAId = `e8888888-1111-4111-8111-${String(ts).slice(-12)}`;
  const eventBId = `e8888888-2222-4222-8222-${String(ts).slice(-12)}`;

  let managerUser = null;
  let scannerUser = null;
  let outsiderUser = null;

  let managerCookies = '';
  let scannerCookies = '';
  let outsiderCookies = '';

  try {
    // 2. Health check Next.js development server
    console.log('[STEP 1] Checking Next.js development server availability...');
    const healthRes = await fetch(`${APP_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error(`Next.js server is not responding at ${APP_URL}/api/health (status: ${healthRes.status})`);
    }
    const healthData = await healthRes.json();
    console.log(`✓ Dev server online: ${healthData.service} (latency: ${healthData.latencyMs}ms)\n`);

    // 3. Register real users through Next.js /api/auth/sign-up/email to get real signed session cookies
    console.log('[STEP 2] Creating real authenticated user sessions via Neon Auth HTTP API...');

    // A. Manager User
    const managerEmail = `e2e-manager-${ts}@example.com`;
    const managerRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: managerEmail, password: 'Password123!@#Test', name: 'E2E Event Manager' }),
    });
    const managerData = await managerRes.json();
    managerUser = managerData.user;
    managerCookies = managerRes.headers.get('set-cookie') || '';
    assert(managerRes.status === 200 && managerUser?.id, `Created authenticated Event Manager (${managerEmail})`);

    // B. Scanner User
    const scannerEmail = `e2e-scanner-${ts}@example.com`;
    const scannerRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: scannerEmail, password: 'Password123!@#Test', name: 'E2E Scanner Operator' }),
    });
    const scannerData = await scannerRes.json();
    scannerUser = scannerData.user;
    scannerCookies = scannerRes.headers.get('set-cookie') || '';
    assert(scannerRes.status === 200 && scannerUser?.id, `Created authenticated Scanner Operator (${scannerEmail})`);

    // C. Outsider User
    const outsiderEmail = `e2e-outsider-${ts}@example.com`;
    const outsiderRes = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': APP_URL },
      body: JSON.stringify({ email: outsiderEmail, password: 'Password123!@#Test', name: 'E2E Outsider User' }),
    });
    const outsiderData = await outsiderRes.json();
    outsiderUser = outsiderData.user;
    outsiderCookies = outsiderRes.headers.get('set-cookie') || '';
    assert(outsiderRes.status === 200 && outsiderUser?.id, `Created authenticated Outsider (${outsiderEmail})`);

    // 4. Seed database with test organizations, events, memberships, and staff assignments
    console.log('\n[STEP 3] Seeding test tenants, events, and staff roles in development PostgreSQL...');
    await db.insert(organizations).values([
      { id: orgAId, name: `Org Alpha (${ts})`, slug: `org-alpha-${ts}`, isActive: true },
      { id: orgBId, name: `Org Beta (${ts})`, slug: `org-beta-${ts}`, isActive: true },
    ]);

    await db.insert(events).values([
      { id: eventAId, organizationId: orgAId, name: `Event A (${ts})`, slug: `event-a-${ts}`, status: 'published' },
      { id: eventBId, organizationId: orgBId, name: `Event B (${ts})`, slug: `event-b-${ts}`, status: 'published' },
    ]);

    await db.insert(organizationMembers).values([
      { organizationId: orgAId, userId: managerUser.id, role: 'member', isActive: true },
      { organizationId: orgAId, userId: scannerUser.id, role: 'member', isActive: true },
    ]);

    await db.insert(eventStaffAssignments).values([
      { eventId: eventAId, userId: managerUser.id, role: 'event_manager', isActive: true },
      { eventId: eventAId, userId: scannerUser.id, role: 'scanner_operator', isActive: true },
    ]);
    console.log('✓ Seeded roles: manager assigned to Event A, scanner assigned to Event A, outsider has no assignments.\n');

    // 5. TEST A: Authenticated Event Manager updating authorized event settings (Expected: 200 OK)
    console.log('--- TEST A: Authenticated Event Manager Updating Authorized Event Settings ---');
    const updateRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': APP_URL,
        'Cookie': managerCookies,
      },
      body: JSON.stringify({ key: 'badge_template', value: 'executive_vip_v1' }),
    });
    const updateJson = await updateRes.json();
    assert(
      updateRes.status === 200 && updateJson.status === 'ok' && updateJson.setting?.value === 'executive_vip_v1',
      'Event Manager successfully updated event settings (200 OK)'
    );

    // Verify GET settings as manager
    const getManagerRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`, {
      headers: { 'Cookie': managerCookies },
    });
    const getManagerJson = await getManagerRes.json();
    assert(
      getManagerRes.status === 200 && getManagerJson.status === 'ok' && getManagerJson.settings?.length > 0,
      'Event Manager successfully fetched event settings (200 OK)'
    );

    // 6. TEST B: Scanner Operator attempting the same settings update (Expected: 403 Forbidden)
    console.log('\n--- TEST B: Scanner Operator Attempting Administrative Settings Update ---');
    const scannerUpdateRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': APP_URL,
        'Cookie': scannerCookies,
      },
      body: JSON.stringify({ key: 'badge_template', value: 'unauthorized_tampering' }),
    });
    const scannerUpdateJson = await scannerUpdateRes.json();
    assert(
      scannerUpdateRes.status === 403 && scannerUpdateJson.code === 'FORBIDDEN',
      'Scanner Operator rejected from updating settings with 403 FORBIDDEN'
    );

    // 7. TEST C: Cross-Organization and Cross-Event Access Denial (Expected: 403 Forbidden)
    console.log('\n--- TEST C: Cross-Organization / Cross-Event Identifier Access Denial ---');
    // C1: Manager of Event A attempting to access Event B (belongs to Org Beta where manager has no role)
    const crossEventRes = await fetch(`${APP_URL}/api/events/${eventBId}/settings`, {
      headers: { 'Cookie': managerCookies },
    });
    const crossEventJson = await crossEventRes.json();
    assert(
      crossEventRes.status === 403 && crossEventJson.code === 'UNAUTHORIZED_EVENT_ACCESS',
      'Manager of Event A accessing Event B rejected with 403 UNAUTHORIZED_EVENT_ACCESS'
    );

    // C2: Outsider user attempting to access Event A
    const outsiderAccessRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`, {
      headers: { 'Cookie': outsiderCookies },
    });
    const outsiderAccessJson = await outsiderAccessRes.json();
    assert(
      outsiderAccessRes.status === 403 && outsiderAccessJson.code === 'UNAUTHORIZED_EVENT_ACCESS',
      'Outsider user accessing Event A rejected with 403 UNAUTHORIZED_EVENT_ACCESS'
    );

    // 8. TEST D: Signed-out user accessing protected endpoint (Expected: 401 Unauthorized)
    console.log('\n--- TEST D: Signed-Out User Accessing Protected Endpoint ---');
    // Sign out manager session via HTTP sign-out endpoint
    const signOutRes = await fetch(`${APP_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': APP_URL,
        'Cookie': managerCookies,
      },
      body: JSON.stringify({}),
    });
    assert(signOutRes.status === 200, 'Manager signed out successfully via /api/auth/sign-out');

    // Use cleared cookies (or no cookies) to access protected settings
    const clearedCookies = signOutRes.headers.get('set-cookie') || '';
    const afterSignOutRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`, {
      headers: { 'Cookie': clearedCookies },
    });
    const afterSignOutJson = await afterSignOutRes.json();
    assert(
      afterSignOutRes.status === 401 && afterSignOutJson.code === 'UNAUTHENTICATED',
      'Signed-out user accessing protected endpoint rejected with 401 UNAUTHENTICATED'
    );

    // Access without any cookie header at all
    const noCookieRes = await fetch(`${APP_URL}/api/events/${eventAId}/settings`);
    const noCookieJson = await noCookieRes.json();
    assert(
      noCookieRes.status === 401 && noCookieJson.code === 'UNAUTHENTICATED',
      'Request with missing cookies rejected with 401 UNAUTHENTICATED'
    );

    // 9. CLEANUP
    await db.delete(auditEvents).where(sql`${auditEvents.organizationId} IN (${orgAId}, ${orgBId})`);
    await db.delete(eventSettings).where(sql`${eventSettings.eventId} IN (${eventAId}, ${eventBId})`);
    await db.delete(eventStaffAssignments).where(sql`${eventStaffAssignments.eventId} IN (${eventAId}, ${eventBId})`);
    await db.delete(events).where(sql`${events.id} IN (${eventAId}, ${eventBId})`);
    await db.delete(organizationMembers).where(sql`${organizationMembers.organizationId} IN (${orgAId}, ${orgBId})`);
    await db.delete(organizations).where(sql`${organizations.id} IN (${orgAId}, ${orgBId})`);
    console.log('✓ All test records cleaned up cleanly.');

  } catch (err) {
    console.error('\nUnexpected failure during HTTP route tests:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`STAGE 2 HTTP ROUTE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runHttpRouteTests();
