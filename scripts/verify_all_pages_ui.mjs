import http from 'http';

const routes = [
  {
    path: '/',
    label: 'Public Homepage (AppleDock & 4-Tier Pricing)',
    contains: ['Free Starter', 'Pro Event', 'Pro Max Summit', 'MS Backstage'],
  },
  {
    path: '/auth/sign-in',
    label: 'Sign In Page (macOS Dark Glass, Self-Hosted CAPTCHA, BackButton)',
    contains: ['Security Verification', 'Sign In to Console', 'Back to Home'],
  },
  {
    path: '/auth/sign-up',
    label: 'Sign Up Page (macOS Dark Glass, Self-Hosted CAPTCHA, BackButton)',
    contains: ['Create an Account', 'Security Verification', 'Back to Sign In'],
  },
  {
    path: '/auth/forgot-password',
    label: 'Forgot Password Page (macOS Dark Glass, BackButton)',
    contains: ['Back to Sign In', 'Reset Your Password'],
  },
  {
    path: '/auth/reset-password',
    label: 'Reset Password Page (macOS Dark Glass, BackButton)',
    contains: ['Back to Sign In', 'Reset Password'],
  },
  {
    path: '/invitations/accept',
    label: 'Accept Invitation Page (BackButton)',
    contains: ['Back to Dashboard'],
  },
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3333${route.path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const missing = [];
        for (const str of route.contains) {
          if (!data.includes(str)) missing.push(str);
        }
        if (res.statusCode === 200 && missing.length === 0) {
          console.log(`✅ [200 OK] ${route.label}`);
          resolve(true);
        } else {
          console.log(`❌ [HTTP ${res.statusCode}] ${route.label} — Missing: ${missing.join(', ')}`);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`❌ [ERR] ${route.label}: ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('--- Verifying MS Backstage Redesigned Pages ---');
  let allPass = true;
  for (const r of routes) {
    const ok = await checkRoute(r);
    if (!ok) allPass = false;
  }
  if (allPass) {
    console.log('\n🌟 All tested routes returned HTTP 200 and verified required UI strings!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some routes failed verification.');
    process.exit(1);
  }
}

run();
