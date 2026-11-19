import dotenv from 'dotenv';
dotenv.config();

import assert from 'node:assert';
import { db, pool } from '../db/index.js';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  platformAdministrators,
  attendees,
} from '../db/schema/index.js';
import {
  requireOrgContext,
  requireEventContext,
  requirePlatformAdminContext,
  AuthorizationError,
} from '../lib/auth/context.ts';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!@#';

console.log('================================================================');
console.log('MS BACKSTAGE — DEMO LOGINS & ROLE ACCEPTANCE TEST SUITE');
console.log(`Target URL: ${APP_URL}`);
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assertTest(condition, name) {
  totalTests++;
  if (condition) {
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${name}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    throw err;
  }
}

async function main() {
  // ---------------------------------------------------------------------------
  // TEST GROUP 1: SERVER-SIDE DEV-ONLY ENFORCEMENT & PRODUCTION LOCKOUT
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Security & Production Lockout Enforcement ---');

  await runAsyncTest('1.1. Demo accounts endpoint returns 200 in development environment', async () => {
    const res = await fetch(`${APP_URL}/api/auth/demo-accounts`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.enabled, true);
    assert.strictEqual(Array.isArray(data.accounts), true);
    assert.strictEqual(data.accounts.length, 5);
  });

  await runAsyncTest('1.2. Production simulation strictly returns 404 Not Found', async () => {
    // Import route handler directly and test with simulated NODE_ENV=production
    const savedEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const { GET } = await import('../app/api/auth/demo-accounts/route.ts');
      const prodRes = await GET();
      assert.strictEqual(prodRes.status, 404, 'Must return 404 in production');
      const prodData = await prodRes.json();
      assert.strictEqual(prodData.error, 'Not found');
      assert.strictEqual(prodData.accounts, undefined, 'No accounts returned in production');
    } finally {
      process.env.NODE_ENV = savedEnv;
    }
  });

  await runAsyncTest('1.3. ENABLE_DEMO_ACCOUNTS=false disables endpoint even in non-production', async () => {
    const savedFlag = process.env.ENABLE_DEMO_ACCOUNTS;
    try {
      process.env.ENABLE_DEMO_ACCOUNTS = 'false';
      const { GET } = await import('../app/api/auth/demo-accounts/route.ts');
      const disabledRes = await GET();
      assert.strictEqual(disabledRes.status, 404);
    } finally {
      process.env.ENABLE_DEMO_ACCOUNTS = savedFlag;
    }
  });

  await runAsyncTest('1.4. Cache-Control header strictly prevents client/proxy caching', async () => {
    const res = await fetch(`${APP_URL}/api/auth/demo-accounts`);
    const cc = res.headers.get('cache-control');
    assert.ok(cc && cc.includes('no-store'), 'Must include no-store in Cache-Control');
  });

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: ALL 5 ROLES PRESENCE AND METADATA
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Demo Roles Verification & Metadata ---');

  const res = await fetch(`${APP_URL}/api/auth/demo-accounts`);
  const { accounts } = await res.json();

  const expectedRoles = [
    { key: 'platform_admin', email: 'admin@msbackstage.internal', name: 'Platform Administrator' },
    { key: 'org_owner', email: 'owner@apexevents.internal', name: 'Organization Owner' },
    { key: 'event_manager', email: 'manager@apexevents.internal', name: 'Event Manager' },
    { key: 'registration_staff', email: 'staff@apexevents.internal', name: 'Registration Desk Staff' },
    { key: 'scanner_operator', email: 'scanner@apexevents.internal', name: 'Scanner Operator' },
  ];

  for (const expected of expectedRoles) {
    runAsyncTest(`2.${expectedRoles.indexOf(expected) + 1}. Role '${expected.name}' exists with expected email & actions`, () => {
      const found = accounts.find((a) => a.roleKey === expected.key);
      assert.ok(found, `Role ${expected.key} should be present`);
      assert.strictEqual(found.email, expected.email);
      assert.strictEqual(found.roleName, expected.name);
      assert.ok(found.description && found.description.length > 10);
      assert.ok(Array.isArray(found.permittedActions) && found.permittedActions.length >= 3);
      assert.ok(found.landingPage && found.landingPage.startsWith('/'));
      assert.strictEqual(found.password, DEMO_PASSWORD);
    });
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: AUTHENTICATION FLOW & CREDENTIAL VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Authentication & Security Credentials ---');

  await runAsyncTest('3.1. Rejection of invalid password for demo account', async () => {
    const badLoginRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_URL },
      body: JSON.stringify({
        email: 'owner@apexevents.internal',
        password: 'IncorrectPassword999!',
      }),
    });
    assert.strictEqual(badLoginRes.ok, false, 'Invalid password must be rejected');
  });

  await runAsyncTest('3.2. Rejection of non-existent demo user', async () => {
    const nonExistentRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_URL },
      body: JSON.stringify({
        email: 'nonexistent-demo@apexevents.internal',
        password: DEMO_PASSWORD,
      }),
    });
    assert.strictEqual(nonExistentRes.ok, false, 'Non-existent email must be rejected');
  });

  // Verify successful authentication for each demo account
  const authenticatedSessions = {};

  for (const exp of expectedRoles) {
    await runAsyncTest(`3.${expectedRoles.indexOf(exp) + 3}. Real authentication for ${exp.name} (${exp.email})`, async () => {
      let loginRes;
      for (let attempt = 1; attempt <= 4; attempt++) {
        loginRes = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: APP_URL },
          body: JSON.stringify({
            email: exp.email,
            password: DEMO_PASSWORD,
          }),
        });
        if (loginRes.status !== 429) break;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }

      assert.strictEqual(loginRes.status, 200, `Sign-in for ${exp.email} must return HTTP 200`);
      const body = await loginRes.json();
      assert.ok(body.user?.id, `User object with ID must be returned for ${exp.email}`);
      assert.strictEqual(body.user.email, exp.email);

      const setCookie = loginRes.headers.get('set-cookie') || '';
      authenticatedSessions[exp.key] = {
        user: body.user,
        cookie: setCookie,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: SERVER-SIDE RBAC CONTEXT & PERMISSIONS VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Server-Side RBAC Resolution & Permissions ---');

  // 4.1. Platform Admin context
  await runAsyncTest('4.1. Platform Administrator holds platform_admin context', async () => {
    const adminUser = authenticatedSessions.platform_admin.user;
    const ctx = await requirePlatformAdminContext({ overrideUser: adminUser });
    assert.strictEqual(ctx.role, 'platform_admin');
    assert.strictEqual(ctx.user.email, 'admin@msbackstage.internal');
  });

  await runAsyncTest('4.2. Non-platform admin is rejected from requirePlatformAdminContext', async () => {
    const ownerUser = authenticatedSessions.org_owner.user;
    try {
      await requirePlatformAdminContext({ overrideUser: ownerUser });
      assert.fail('Should have thrown AuthorizationError');
    } catch (err) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
    }
  });

  // 4.2. Org Owner context
  await runAsyncTest('4.3. Organization Owner holds org_owner role and full permissions', async () => {
    const ownerUser = authenticatedSessions.org_owner.user;
    const ctx = await requireOrgContext('apex-events', { overrideUser: ownerUser });
    assert.strictEqual(ctx.effectiveRole, 'org_owner');
    assert.strictEqual(ctx.organization.slug, 'apex-events');
    assert.strictEqual(ctx.hasPermission('org:delete'), true);
    assert.strictEqual(ctx.hasPermission('org:manage_members'), true);
    assert.strictEqual(ctx.hasPermission('org:transfer_ownership'), true);
  });

  // 4.3. Event Manager context
  await runAsyncTest('4.4. Event Manager holds event_manager role with manage_staff rights', async () => {
    const managerUser = authenticatedSessions.event_manager.user;
    const ctx = await requireEventContext('apex-summit-2026', { overrideUser: managerUser });
    assert.strictEqual(ctx.effectiveRole, 'event_manager');
    assert.strictEqual(ctx.hasPermission('event:manage_staff'), true);
    assert.strictEqual(ctx.hasPermission('event:update_settings'), true);
    assert.strictEqual(ctx.hasPermission('event:import_attendees'), true);
    assert.strictEqual(ctx.hasPermission('event:delete'), false, 'Event manager cannot delete event');
  });

  // 4.4. Registration Staff context
  await runAsyncTest('4.5. Registration Staff holds registration_staff role with spot creation rights', async () => {
    const staffUser = authenticatedSessions.registration_staff.user;
    const ctx = await requireEventContext('apex-summit-2026', { overrideUser: staffUser });
    assert.strictEqual(ctx.effectiveRole, 'registration_staff');
    assert.strictEqual(ctx.hasPermission('event:create_attendee'), true);
    assert.strictEqual(ctx.hasPermission('event:print_badge'), true);
    assert.strictEqual(ctx.hasPermission('event:manage_staff'), false, 'Desk staff cannot manage staff');
    assert.strictEqual(ctx.hasPermission('event:update_settings'), false, 'Desk staff cannot update settings');
  });

  // 4.5. Scanner Operator context
  await runAsyncTest('4.6. Scanner Operator holds scanner_operator role with scan_badge rights', async () => {
    const scannerUser = authenticatedSessions.scanner_operator.user;
    const ctx = await requireEventContext('apex-summit-2026', { overrideUser: scannerUser });
    assert.strictEqual(ctx.effectiveRole, 'scanner_operator');
    assert.strictEqual(ctx.hasPermission('event:scan_badge'), true);
    assert.strictEqual(ctx.hasPermission('event:view_scans'), true);
    assert.strictEqual(ctx.hasPermission('event:create_attendee'), false, 'Scanner cannot register attendees');
    assert.strictEqual(ctx.hasPermission('event:manage_staff'), false, 'Scanner cannot manage staff');
  });

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: TENANT ISOLATION & UNAUTHORIZED ACCESS PREVENTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Tenant Isolation & Unauthorized Route Access ---');

  await runAsyncTest('5.1. Scanner operator cannot access organization settings', async () => {
    const scannerUser = authenticatedSessions.scanner_operator.user;
    // Scanner is in org as member, but cannot perform org:update or org:manage_members
    const orgCtx = await requireOrgContext('apex-events', { overrideUser: scannerUser });
    assert.strictEqual(orgCtx.hasPermission('org:update'), false);
    assert.strictEqual(orgCtx.hasPermission('org:manage_members'), false);
  });

  await runAsyncTest('5.2. Registration staff cannot update event settings', async () => {
    const staffUser = authenticatedSessions.registration_staff.user;
    const eventCtx = await requireEventContext('apex-summit-2026', { overrideUser: staffUser });
    assert.throws(
      () => eventCtx.assertPermission('event:update_settings'),
      AuthorizationError
    );
  });

  await runAsyncTest('5.3. External outsider user is denied access to apex-events', async () => {
    const outsider = { id: '00000000-0000-4000-8000-000000000099', email: 'outsider@otherorg.com' };
    try {
      await requireOrgContext('apex-events', { overrideUser: outsider });
      assert.fail('Should have denied outsider');
    } catch (err) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
    }
  });

  await runAsyncTest('5.4. External outsider user is denied access to apex-summit-2026', async () => {
    const outsider = { id: '00000000-0000-4000-8000-000000000099', email: 'outsider@otherorg.com' };
    try {
      await requireEventContext('apex-summit-2026', { overrideUser: outsider });
      assert.fail('Should have denied outsider');
    } catch (err) {
      assert.ok(err instanceof AuthorizationError);
      assert.strictEqual(err.statusCode, 403);
    }
  });

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: FIXTURES INTEGRITY (ORGANIZATION, EVENT, ATTENDEES)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Seed Fixtures Integrity ---');

  await runAsyncTest('6.1. Apex Events organization exists and is active', async () => {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, 'apex-events'));
    assert.ok(org, 'Apex Events must exist in DB');
    assert.strictEqual(org.isActive, true);
  });

  await runAsyncTest('6.2. Apex Global Summit 2026 event exists and is published', async () => {
    const [ev] = await db.select().from(events).where(eq(events.slug, 'apex-summit-2026'));
    assert.ok(ev, 'Apex Global Summit 2026 must exist in DB');
    assert.strictEqual(ev.status, 'published');
  });

  await runAsyncTest('6.3. Sample attendees exist with multiple attendance states for testing', async () => {
    const [ev] = await db.select().from(events).where(eq(events.slug, 'apex-summit-2026'));
    const atts = await db.select().from(attendees).where(eq(attendees.eventId, ev.id));
    assert.ok(atts.length >= 5, 'Must have at least 5 sample attendees');

    const statuses = new Set(atts.map((a) => a.attendanceStatus));
    assert.ok(statuses.has('checked_in'), 'Must have checked_in attendee for scanner test');
    assert.ok(statuses.has('not_checked_in'), 'Must have not_checked_in attendee for scanner test');
  });

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: SIGN-IN PAGE UI & LOGOUT REDIRECT ROUTING
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Sign-In Page UI & Routing ---');

  await runAsyncTest('7.1. Sign-in page loads with HTTP 200', async () => {
    const pageRes = await fetch(`${APP_URL}/auth/sign-in`);
    assert.strictEqual(pageRes.status, 200);
    const html = await pageRes.text();
    assert.ok(html.includes('MS Backstage'), 'Must include MS Backstage branding');
    assert.ok(!html.includes('Continue with Apple'), 'Apple login button must be removed');
    assert.ok(!html.includes('Continue with Facebook'), 'Facebook login button must be removed');
  });

  await runAsyncTest('7.2. Sign-out route loads and handles session termination', async () => {
    const signOutRes = await fetch(`${APP_URL}/auth/sign-out`);
    assert.strictEqual(signOutRes.status, 200);
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\nTest Suite Failed with unexpected error:', err);
  process.exit(1);
});
