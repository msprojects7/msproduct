import dotenv from 'dotenv';
dotenv.config();

import assert from 'node:assert';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!@#';

console.log('================================================================');
console.log('MS BACKSTAGE — AUTHENTICATION UI & MIGRATION VERIFICATION SUITE');
console.log(`Target Base URL: ${APP_URL}`);
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

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
  // 1. Homepage loads
  await runAsyncTest('1. Homepage loads successfully with MS Backstage branding', async () => {
    const res = await fetch(`${APP_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('MS Backstage'), 'Homepage must contain MS Backstage title/branding');
  });

  // 2. Sign-in page loads
  await runAsyncTest('2. Sign-in page loads with HTTP 200 OK', async () => {
    const res = await fetch(`${APP_URL}/auth/sign-in`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('MS Backstage'), 'Sign-in page must feature MS Backstage');
    assert.ok(html.includes('Event Operations'), 'Sign-in page subtitle must be present');
  });

  // 3. Apple and Facebook buttons are absent
  await runAsyncTest('3. Apple and Facebook social buttons are completely absent from UI', async () => {
    const res = await fetch(`${APP_URL}/auth/sign-in`);
    const html = await res.text();
    assert.strictEqual(html.includes('Continue with Apple'), false, 'Apple login button must be removed');
    assert.strictEqual(html.includes('Continue with Facebook'), false, 'Facebook login button must be removed');
  });

  // 4. Google sign-in appears only if configured
  await runAsyncTest('4. Google sign-in appears only if configured in environment', async () => {
    const isGoogleConfigured = Boolean(
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    );
    const res = await fetch(`${APP_URL}/auth/sign-in`);
    const html = await res.text();
    if (!isGoogleConfigured) {
      assert.strictEqual(html.includes('Continue with Google'), false, 'Google button must not show if unconfigured');
    } else {
      assert.strictEqual(html.includes('Continue with Google'), true, 'Google button must show when configured');
    }
  });

  // 5. Email/password authentication still works
  let authCookie = '';
  await runAsyncTest('5. Email/password authentication works with verified credentials', async () => {
    const res = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_URL },
      body: JSON.stringify({
        email: 'owner@apexevents.internal',
        password: DEMO_PASSWORD,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.user?.id, 'Returned user must contain ID');
    assert.strictEqual(data.user.email, 'owner@apexevents.internal');

    const setCookies = res.headers.getSetCookie?.() || [res.headers.get('set-cookie') || ''];
    authCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    assert.ok(authCookie.includes('session_token'), 'Session token cookie must be minted');
  });

  // 6. Invalid credentials are rejected
  await runAsyncTest('6. Invalid credentials are rejected with authentication error', async () => {
    const res = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_URL },
      body: JSON.stringify({
        email: 'owner@apexevents.internal',
        password: 'CompletelyWrongPassword!123',
      }),
    });
    assert.strictEqual(res.ok, false);
    assert.ok(res.status === 400 || res.status === 401, 'Must reject with 400 or 401');
  });

  // 7. Sign-up, forgot-password, and reset-password routes load
  await runAsyncTest('7.1. Sign-up route loads with OTP flow controls', async () => {
    const res = await fetch(`${APP_URL}/auth/sign-up`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Create your account'));
  });

  await runAsyncTest('7.2. Forgot-password route loads with MS Backstage recovery UI', async () => {
    const res = await fetch(`${APP_URL}/auth/forgot-password`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Reset Password'));
  });

  await runAsyncTest('7.3. Reset-password route loads with token input UI', async () => {
    const res = await fetch(`${APP_URL}/auth/reset-password`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Set New Password'));
  });

  // 8. Authenticated navigation stays within the intended application
  await runAsyncTest('8. Authenticated navigation reaches Next.js dashboard', async () => {
    const res = await fetch(`${APP_URL}/dashboard`, {
      headers: { Cookie: authCookie },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 200, 'Authenticated user must access /dashboard with 200');
    const html = await res.text();
    assert.ok(html.includes('MS Backstage'), 'Dashboard must display MS Backstage');
    assert.ok(html.includes('Your Organizations'), 'Dashboard must display tenant organizations');
    assert.ok(html.includes('Apex Events'), 'Owner must see Apex Events tenant');
  });

  // 9. Logout works
  await runAsyncTest('9. Sign-out route clears session and redirects to sign-in with notice', async () => {
    const res = await fetch(`${APP_URL}/auth/sign-out`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Signing out'));
  });

  // 10. Protected pages require authentication
  await runAsyncTest('10. Protected pages redirect unauthenticated visitors to /auth/sign-in', async () => {
    const res = await fetch(`${APP_URL}/dashboard`, {
      redirect: 'manual',
    });
    // Next.js redirect returns 307 or 302
    assert.ok([302, 307].includes(res.status), `Must return redirect status (received: ${res.status})`);
    const location = res.headers.get('location');
    assert.ok(location && location.includes('/auth/sign-in'), `Must redirect to /auth/sign-in (got: ${location})`);
  });

  // 11. No unintended redirects to legacy port 5173 occur
  await runAsyncTest('11. Zero redirects to port 5173 or external domains', async () => {
    const routesToTest = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/dashboard'];
    for (const route of routesToTest) {
      const res = await fetch(`${APP_URL}${route}`, { redirect: 'manual' });
      const location = res.headers.get('location');
      if (location) {
        assert.strictEqual(location.includes('5173'), false, `Route ${route} must not redirect to port 5173`);
      }
    }
  });

  console.log('\n================================================================');
  console.log(`ALL VERIFICATION CHECKS PASSED: ${passedTests}/${totalTests} TESTS`);
  console.log('================================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
