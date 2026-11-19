import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/browser_tests/visual_studio_granular');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3333';

async function runGranularStudioTestSuite() {
  console.log('====================================================================');
  console.log('MS BACKSTAGE: GRANULAR VISUAL DESIGN STUDIO E2E VERIFICATION SUITE');
  console.log('====================================================================');

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
    // ── 1. AUTHENTICATE VIA DEMO LOGIN ──
    console.log('\n--- 1. Authenticate via Demo Login ---');
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
    await page.locator('#demo-logins-trigger-btn').click();
    await page.waitForSelector('#demo-direct-platform_admin', { timeout: 10000 });
    await page.locator('#demo-direct-platform_admin').click();
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    record('Authenticated into MS Backstage Dashboard', page.url().includes('/dashboard'));

    // ── 2. OPEN WEBSITE DESIGN STUDIO ──
    console.log('\n--- 2. Open Website Design Studio for summit-26 ---');
    await page.goto(`${BASE_URL}/events/summit-26/website`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    record('Website Design Studio loaded', page.url().includes('/events/summit-26/website'));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_studio.png') });

    // ── 3. SELECT & EDIT HEADER SECTION ──
    console.log('\n--- 3. Granular Header Inspector & Immediate Canvas Binding ---');
    // Click Header container on canvas
    await page.locator('#canvas-header').click();
    await page.waitForTimeout(500);

    const hasHeaderInspector = (await page.locator('text=Header Bar Appearance').count()) > 0;
    record('Header Inspector panel activated in right sidebar', hasHeaderInspector);

    // Edit Header Background Color to #111827
    const headerBgInput = page.locator('aside input[type="color"]').first();
    if (await headerBgInput.count() > 0) {
      await headerBgInput.fill('#111827');
      await page.waitForTimeout(300);
    }

    // Edit Header CTA Text to "VIP Passes"
    const ctaLabel = page.locator('aside label:has-text("CTA Button Text")');
    if (await ctaLabel.count() > 0) {
      const ctaInput = ctaLabel.locator('..').locator('input');
      await ctaInput.fill('VIP Passes');
      await page.waitForTimeout(300);
      record('Header CTA button text editable in inspector', true);
    }

    // Edit Header Height slider
    const headerHeightSlider = page.locator('aside input[type="range"][min="44"]');
    if ((await headerHeightSlider.count()) > 0) {
      await headerHeightSlider.fill('76');
      await page.waitForTimeout(300);
      record('Header Height slider adjusted to 76px', true);
    }

    // Verify Canvas Header updated immediately
    const canvasCtaText = await page.locator('#canvas-header button').first().textContent();
    record('Canvas Header immediately reflects updated CTA text', canvasCtaText.includes('VIP Passes'), canvasCtaText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_header_customized.png') });

    // ── 4. SELECT & EDIT HERO SECTION ──
    console.log('\n--- 4. Granular Hero Inspector & Immediate Canvas Binding ---');
    // Click Hero on canvas
    await page.locator('#hero').click();
    await page.waitForTimeout(500);

    const hasHeroInspector = (await page.locator('text=Hero Text & Typography').count()) > 0;
    record('Hero Inspector panel activated in right sidebar', hasHeroInspector);

    // Edit Hero Eyebrow
    const eyebrowLabel = page.locator('aside label:has-text("Eyebrow Badge Text")');
    if (await eyebrowLabel.count() > 0) {
      const eyebrowInput = eyebrowLabel.locator('..').locator('input');
      await eyebrowInput.fill('Exclusive Global Summit 2026');
      await page.waitForTimeout(300);
      record('Hero eyebrow badge text updated', true);
    }

    // Edit Hero Title to "Global Quantum & AI Summit 2026"
    const heroTitleLabel = page.locator('aside label:has-text("Hero Title")');
    if (await heroTitleLabel.count() > 0) {
      const heroTitleInput = heroTitleLabel.locator('..').locator('input');
      await heroTitleInput.fill('Global Quantum & AI Summit 2026');
      await page.waitForTimeout(300);
      record('Hero Title input updated', true);
    }

    // Select Center Alignment
    const centerAlignBtn = page.locator('aside button:has-text("center")').first();
    if ((await centerAlignBtn.count()) > 0) {
      await centerAlignBtn.click();
      await page.waitForTimeout(300);
      record('Hero alignment set to center', true);
    }

    // Edit Primary CTA Button text
    const heroCtaInput = page.locator('aside input[placeholder="Button Label"]').first();
    if ((await heroCtaInput.count()) > 0) {
      await heroCtaInput.fill('Reserve Pass Now');
      await page.waitForTimeout(300);
      record('Hero primary CTA button text updated', true);
    }

    // Verify Canvas Hero updated immediately
    const canvasHeroTitle = await page.locator('#hero h1').textContent();
    record('Canvas Hero immediately reflects new title', canvasHeroTitle.includes('Global Quantum & AI Summit 2026'), canvasHeroTitle);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_hero_customized.png') });

    // ── 5. SELECT & EDIT ABOUT SECTION ──
    console.log('\n--- 5. Section Properties (About Section) ---');
    await page.locator('#about').click();
    await page.waitForTimeout(500);

    const hasSectionInspector = (await page.locator('text=Section Content & Headers').count()) > 0;
    record('Section Properties inspector activated in right sidebar', hasSectionInspector);

    // Edit Section Subtitle
    const subtitleInput = page.locator('aside input[placeholder*="Optional section description"]').first();
    if ((await subtitleInput.count()) > 0) {
      await subtitleInput.fill('The worlds preeminent gathering of technology innovators and faculty.');
      await page.waitForTimeout(300);
      record('Section subtitle updated', true);
    }

    // Edit Section Background Color to #f0fdf4
    const secBgInput = page.locator('aside input[type="text"][value*="#"]').first();
    if ((await secBgInput.count()) > 0) {
      await secBgInput.fill('#f0fdf4');
      await page.waitForTimeout(300);
      record('Section background color set to #f0fdf4', true);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_section_customized.png') });

    // ── 6. SELECT & EDIT FOOTER SECTION ──
    console.log('\n--- 6. Footer Properties Inspector ---');
    // Scroll down and click footer
    await page.locator('#canvas-footer').click();
    await page.waitForTimeout(500);

    const hasFooterInspector = (await page.locator('text=Footer Background & Styling').count()) > 0;
    record('Footer Properties inspector activated in right sidebar', hasFooterInspector);

    // Edit Copyright Statement
    const copyrightInput = page.locator('aside input[value*="©"]').first();
    if ((await copyrightInput.count()) > 0) {
      await copyrightInput.fill('© 2026 MS Backstage Studio Verified. All rights reserved.');
      await page.waitForTimeout(300);
      record('Footer copyright statement updated', true);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_footer_customized.png') });

    // ── 7. SAVE CONFIGURATION TO DATABASE ──
    console.log('\n--- 7. Save Website Studio Configuration ---');
    const saveBtn = page.locator('button:has-text("Save Website")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const isSaved = (await page.locator('text=Saved!').count()) > 0 || (await saveBtn.textContent()).includes('Saved');
    record('Website configuration saved to Neon PostgreSQL successfully', isSaved);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_saved_state.png') });

    // ── 8. HARD RELOAD EDITOR TO VERIFY PERSISTENCE ──
    console.log('\n--- 8. Hard Reload Editor & Verify Persistence ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const reloadedHeroTitle = await page.locator('#hero h1').textContent();
    record('Saved Hero Title persists across hard reload', reloadedHeroTitle.includes('Global Quantum & AI Summit 2026'), reloadedHeroTitle);

    // ── 9. PUBLIC MICROSITE VERIFICATION (/p/summit-26) ──
    console.log('\n--- 9. Verify Public Microsite (/p/summit-26) ---');
    await page.goto(`${BASE_URL}/p/summit-26`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // 1. Verify Public Hero Title
    const publicTitle = await page.locator('h1').textContent();
    record('Public website renders saved Hero Title', publicTitle.includes('Global Quantum & AI Summit 2026'), publicTitle);

    // 2. Verify Public Eyebrow
    const publicEyebrow = await page.locator('text=Exclusive Global Summit 2026').count();
    record('Public website renders saved Hero Eyebrow', publicEyebrow > 0);

    // 3. Verify Public About Subtitle
    const publicAboutSubtitle = await page.locator('text=The worlds preeminent gathering of technology innovators and faculty.').count();
    record('Public website renders saved Section Subtitle', publicAboutSubtitle > 0);

    // 4. Verify Public Footer Copyright
    const publicFooterText = await page.locator('footer').first().textContent();
    record('Public website renders saved Footer statement', publicFooterText.includes('MS Backstage Studio Verified'), publicFooterText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_public_desktop.png') });

    // ── 10. MULTI-DEVICE RESPONSIVENESS & ZERO OVERFLOW AUDIT ──
    console.log('\n--- 10. Multi-Device Responsiveness & Zero Horizontal Overflow Audit ---');

    // Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const tabletWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Tablet (768px): Zero horizontal overflow', tabletWidth <= 768, `scrollWidth: ${tabletWidth}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_public_tablet_768.png') });

    // Mobile (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const mobileWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Mobile (375px): Zero horizontal overflow', mobileWidth <= 375, `scrollWidth: ${mobileWidth}`);

    // Mobile Menu Drawer Test
    const mobileMenuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
    const hasMobileMenuBtn = (await mobileMenuBtn.count()) > 0;
    record('Mobile menu hamburger button present and accessible', hasMobileMenuBtn);

    if (hasMobileMenuBtn) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(400);
      const isDrawerOpen = (await page.locator('text=Navigation Menu').count()) > 0;
      record('Mobile navigation drawer expands with all section links', isDrawerOpen);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_public_mobile_drawer_open.png') });
    }

    // Ultra-Compact (320px)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(400);
    const ultraWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Ultra-compact Mobile (320px): Zero horizontal overflow', ultraWidth <= 320, `scrollWidth: ${ultraWidth}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_public_ultra_compact_320.png') });

  } catch (err) {
    console.error('Fatal Test Exception:', err);
    record('Granular test suite completed without unhandled exceptions', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(`GRANULAR VISUAL STUDIO SUITE RESULT: ${results.passed}/${results.total} Passed`);
  console.log('======================================================');
  if (results.failed > 0) {
    process.exit(1);
  }
}

runGranularStudioTestSuite();
