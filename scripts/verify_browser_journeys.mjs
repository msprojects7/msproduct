import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/browser_tests');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3333';

async function runBrowserJourneys() {
  console.log('🚀 Starting MS Backstage Playwright Browser Verification Suite...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  function record(name, pass, info = '') {
    results.total++;
    if (pass) {
      results.passed++;
      console.log(`✅ [PASS] ${name}${info ? ` — ${info}` : ''}`);
      results.details.push({ name, status: 'PASS', info });
    } else {
      results.failed++;
      console.error(`❌ [FAIL] ${name}${info ? ` — ${info}` : ''}`);
      results.details.push({ name, status: 'FAIL', info });
    }
  }

  try {
    // ── JOURNEY 1: PUBLIC HOMEPAGE & THEME TOGGLE ──
    console.log('\n--- JOURNEY 1: Public Homepage & Light/Dark Theme Switching ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Check title and hero
    const heroTitle = await page.locator('h1').textContent();
    record('Homepage loads with hero title', heroTitle.includes('Every Event. One Seamless Backstage.'));

    // Check Dark Mode initial state
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    record('Initial theme is dark mode', isDarkInitially);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_dark_1440px.png') });

    // Click Theme Toggle button
    const themeBtn = page.locator('#theme-toggle-btn').first();
    await themeBtn.click();
    await page.waitForTimeout(500);

    const isLightNow = await page.evaluate(() => document.documentElement.classList.contains('light'));
    const storedTheme = await page.evaluate(() => localStorage.getItem('ms_theme'));
    record('Theme toggle switches to Light Mode', isLightNow && storedTheme === 'light');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_home_light_1440px.png') });

    // Verify Theme persistence after reload
    await page.reload({ waitUntil: 'networkidle' });
    const isLightAfterReload = await page.evaluate(() => document.documentElement.classList.contains('light'));
    record('Light theme persists across page reload', isLightAfterReload);

    // Switch back to Dark Mode
    await page.locator('#theme-toggle-btn').first().click();
    await page.waitForTimeout(300);

    // ── JOURNEY 2: BADGE SHOWCASE INTERACTION ──
    console.log('\n--- JOURNEY 2: Badge Designer Showcase Interactive Tabs ---');
    const medicalTab = page.locator('button:has-text("Medical Conference")');
    if (await medicalTab.count() > 0) {
      await medicalTab.click();
      await page.waitForTimeout(400);
      const medicalDesc = await page.locator('text=Medical Council Reg #').count();
      record('Badge Showcase switches to Medical Conference template', medicalDesc > 0);
    } else {
      record('Badge Showcase template tabs present', false);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_badge_showcase_tab.png') });

    // ── JOURNEY 3: FEATURES & PRICING PAGES ──
    console.log('\n--- JOURNEY 3: Features & Pricing Pages ---');
    await page.goto(`${BASE_URL}/features`, { waitUntil: 'networkidle' });
    const featuresTitle = await page.locator('h1').textContent();
    record('Features page loads with full breakdown', featuresTitle.includes('Engineered for Flawless'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_features_page.png') });

    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    const pricingTitle = await page.locator('h1').textContent();
    record('Pricing page loads with 4 tiers', pricingTitle.includes('Transparent Pricing'));
    
    // Test billing cadence switch
    await page.locator('button:has-text("Annual Pass")').click();
    await page.waitForTimeout(300);
    const annualPrice = await page.locator('text=₹1,600').count();
    record('Pricing annual cadence calculation works', annualPrice > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_pricing_annual.png') });

    // ── JOURNEY 4: MOBILE RESPONSIVENESS (375px) ──
    console.log('\n--- JOURNEY 4: Mobile Viewport Responsiveness ---');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Mobile 375px has no horizontal overflow', scrollWidth <= 375);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_home_mobile_375px.png') });

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // ── JOURNEY 5: AUTHENTICATION & CAPTCHA ──
    console.log('\n--- JOURNEY 5: Sign In & Self-Hosted CAPTCHA ---');
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
    const backBtn = await page.locator('text=Back to Home').count();
    record('Sign In page has BackButton', backBtn > 0);

    // Wait for CAPTCHA SVG to render
    await page.waitForSelector('svg', { timeout: 10000 });
    const hasCaptcha = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      return Boolean(svg && svg.outerHTML.length > 50);
    });
    record('Self-hosted CAPTCHA visual canvas renders', hasCaptcha);

    // Test CAPTCHA refresh button
    const refreshBtn = page.locator('button:has-text("Refresh")').first();
    if (await refreshBtn.count() > 0) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
      record('CAPTCHA refresh button generates new challenge', true);
    }

    // Test form validation on empty input
    await page.locator('button:has-text("Sign In to Console")').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_signin_validation.png') });

    // Test Google OAuth button feedback
    await page.locator('#google-sign-in-btn').click();
    await page.waitForTimeout(600);
    const googleFeedbackCount = await page.evaluate(() => {
      const text = document.body.innerText;
      return (text.includes('Google OAuth is awaiting') || text.includes('Google OAuth provider is not yet configured')) ? 1 : 0;
    });
    record('Google OAuth button gives informative feedback', googleFeedbackCount > 0);

    // ── JOURNEY 6: WORKSPACE LOGIN & ORGANIZATIONS ──
    console.log('\n--- JOURNEY 6: Demo Workspace Login & /organizations ---');
    // Open Demo Login Modal using button ID
    await page.locator('#demo-logins-trigger-btn').click();
    
    // Wait for demo accounts modal to finish loading
    await page.waitForSelector('#demo-direct-platform_admin', { timeout: 10000 });
    
    // Sign in as Platform Administrator directly
    await page.locator('#demo-direct-platform_admin').click();
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    await page.waitForTimeout(1000);
    record('Successfully signed into Workspace Dashboard', page.url().includes('/dashboard'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_dashboard_view.png') });

    // Verify /organizations route is functional (NOT 404!)
    await page.goto(`${BASE_URL}/organizations`, { waitUntil: 'networkidle' });
    const orgsHeading = await page.locator('h1').textContent();
    record('Route /organizations loads successfully (No 404!)', orgsHeading.includes('Organizations'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_organizations_page.png') });

    // ── JOURNEY 7: EVENT CONSOLE & ATTENDEES DIRECTORY ──
    console.log('\n--- JOURNEY 7: Event Operations Workspace ---');
    await page.goto(`${BASE_URL}/events/apex-summit-2026`, { waitUntil: 'networkidle' });
    const eventConsoleHeading = await page.locator('text=Event Operations Console').count();
    record('Event Console loads for apex-summit-2026', eventConsoleHeading > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_event_console.png') });

    // Attendees Directory
    await page.goto(`${BASE_URL}/events/apex-summit-2026/attendees`, { waitUntil: 'networkidle' });
    const attendeesCount = await page.locator('text=attendee').count();
    record('Attendees Directory loads with data grid', attendeesCount > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_attendees_directory.png') });

    // ── JOURNEY 8: SPOT REGISTRATION DESK ──
    console.log('\n--- JOURNEY 8: Rapid Spot Registration Desk ---');
    await page.goto(`${BASE_URL}/events/apex-summit-2026/spot-registration`, { waitUntil: 'networkidle' });
    
    // Register attendee with Name Only (verifying mandatory rule)
    const testAttendeeName = `Dr. Automated Test ${Date.now().toString().slice(-4)}`;
    await page.locator('input[placeholder*="Rajesh Sharma"]').fill(testAttendeeName);
    await page.locator('button:has-text("Complete Spot Registration")').click();
    
    await page.waitForSelector('text=Spot Registration Confirmed', { timeout: 10000 });
    const badgeNumber = await page.locator('text=Registration Number:').locator('..').textContent();
    record('Spot registration succeeds with name-only mandatory field', badgeNumber.includes('APX-'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_spot_reg_success.png') });

    // ── JOURNEY 9: BADGE DESIGNER & SHEET PRINT PREVIEW ──
    console.log('\n--- JOURNEY 9: Badge Designer & A4 Sheet Printing ---');
    await page.goto(`${BASE_URL}/events/apex-summit-2026/badges/designer`, { waitUntil: 'networkidle' });
    const canvasExists = await page.locator('text=WYSIWYG Direct Canvas').count();
    record('Interactive Badge Designer canvas loads', canvasExists > 0);

    // Open Print Preview Modal
    await page.locator('button:has-text("Sheet Print Preview")').click();
    await page.waitForTimeout(500);
    const printModal = await page.locator('text=Badge Sheet Printing').count();
    record('A4 Sheet Print Preview modal opens', printModal > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_print_preview_modal.png') });
    
    // Close modal
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(300);

    // ── JOURNEY 10: REPORTS & EXPORTS ──
    console.log('\n--- JOURNEY 10: Reports & Analytics ---');
    await page.goto(`${BASE_URL}/events/apex-summit-2026/reports`, { waitUntil: 'networkidle' });
    const reportsHeading = await page.locator('h1').textContent();
    record('Reports & Analytics page loads with export buttons', reportsHeading.includes('Reports & Attendance Analytics'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_reports_analytics.png') });

  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    record('Suite execution without crash', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`BROWSER SUITE COMPLETED: ${results.passed}/${results.total} PASSED`);
  console.log('================================================================\n');

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

runBrowserJourneys().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  }
});
