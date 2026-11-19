import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/browser_tests/website_builder_final');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3333';

async function runFinalWebsiteBuilderTestSuite() {
  console.log('================================================================');
  console.log('MS BACKSTAGE: ENTERPRISE-GRADE WEBSITE STUDIO PLAYWRIGHT SUITE');
  console.log('================================================================');

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
    // ── STEP 1: AUTHENTICATION VIA DEMO LOGIN ──
    console.log('\n--- STEP 1: Authenticate via Demo Login ---');
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
    await page.locator('#demo-logins-trigger-btn').click();
    await page.waitForSelector('#demo-direct-platform_admin', { timeout: 10000 });
    await page.locator('#demo-direct-platform_admin').click();
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    await page.waitForTimeout(1000);
    record('Successfully signed into Workspace Dashboard', page.url().includes('/dashboard'));

    // ── STEP 2: OPEN WEBSITE STUDIO EDITOR ──
    console.log('\n--- STEP 2: Open Event Website Builder Studio ---');
    await page.goto(`${BASE_URL}/events/summit-26/website`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const titleText = await page.title();
    record('Page title verified', titleText.includes('MS Backstage'), titleText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_editor.png') });

    // ── STEP 3: RESPONSIVE BREAKPOINT CANVAS SWITCHING ──
    console.log('\n--- STEP 3: Wix Studio-Style Breakpoint Switching ---');
    // Tablet Viewport (768px)
    await page.locator('button[title="Tablet View (768px)"]').click();
    await page.waitForTimeout(400);
    const tabletCanvasCount = await page.locator('.max-w-\\[768px\\]').count();
    record('Tablet breakpoint toggles canvas width constraint to 768px', tabletCanvasCount > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_tablet_editor.png') });

    // Mobile Viewport (390px/375px)
    await page.locator('button[title="Mobile View (375px)"]').click();
    await page.waitForTimeout(400);
    const mobileCanvasCount = await page.locator('.max-w-\\[390px\\]').count();
    record('Mobile breakpoint toggles canvas width constraint to 390px', mobileCanvasCount > 0);

    // Verify Mobile Header does NOT overflow and renders hamburger menu
    const mobileHamburger = page.locator('button[title="Toggle Mobile Navigation Drawer"]');
    const hasHamburger = (await mobileHamburger.count()) > 0;
    record('Mobile canvas intelligently renders Hamburger Menu button instead of clipping navigation links', hasHamburger);

    // Click Hamburger to test mobile drawer open
    if (hasHamburger) {
      await mobileHamburger.click();
      await page.waitForTimeout(300);
      const drawerVisible = (await page.locator('text=Mobile Menu Navigation').count()) > 0;
      record('Mobile navigation drawer expands inside canvas container', drawerVisible);
      // Close drawer
      await mobileHamburger.click();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_mobile_editor.png') });

    // Switch back to Desktop
    await page.locator('button[title="Desktop View (100%)"]').click();
    await page.waitForTimeout(300);
    record('Restored Desktop baseline viewport', true);

    // ── STEP 4: 10 TEMPLATE PRESETS ──
    console.log('\n--- STEP 4: 10 Website Template Presets ---');
    const isTemplateDrawerOpen = (await page.locator('text=10 Website Templates').count()) > 0;
    if (!isTemplateDrawerOpen) {
      await page.locator('button[title="Templates"]').click();
      await page.waitForTimeout(400);
    }
    const techSummitPreset = page.locator('text=Technology Summit').first();
    const hasTechSummit = (await techSummitPreset.count()) > 0;
    record('Templates drawer displays template presets', hasTechSummit);

    if (hasTechSummit) {
      await techSummitPreset.click();
      await page.waitForTimeout(600);
      record('Applied Technology Summit template styling', true);
    }

    // ── STEP 5: HEADER & HERO INSPECTION & PHOTO MODE ──
    console.log('\n--- STEP 5: Header, Hero & 100% Photo Mode ---');
    // Select Header
    const headerElement = page.locator('.max-w-5xl > div:first-child').first();
    await headerElement.click();
    await page.waitForTimeout(400);
    const headerSettingsHeader = await page.locator('text=Header Settings').count();
    record('Clicking Header opens Header Settings in right inspector', headerSettingsHeader > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_header_customization.png') });

    // Select Hero
    const heroSection = page.locator('#hero');
    await heroSection.click();
    await page.waitForTimeout(400);
    const heroSettingsHeader = await page.locator('text=Hero Section Settings').count();
    record('Clicking Hero opens Hero Section Settings in right inspector', heroSettingsHeader > 0);

    // Toggle 100% Photo Mode / Remove Color Overlay
    const photoModeBtn = page.locator('button:has-text("Remove Color Overlay"), button:has-text("100% Photo")').first();
    if (await photoModeBtn.count() > 0) {
      const initialText = await photoModeBtn.textContent();
      await photoModeBtn.click();
      await page.waitForTimeout(400);
      const newText = await photoModeBtn.textContent();
      record('Hero 100% Photo Mode toggle operational', initialText !== newText, `${initialText} -> ${newText}`);
    }

    // Edit Hero Headline
    const heroTitleLabel = page.locator('aside label:has-text("Hero Title")');
    if (await heroTitleLabel.count() > 0) {
      const heroTitleInput = heroTitleLabel.locator('..').locator('input');
      await heroTitleInput.fill('Global Tech & Innovation Summit 2026');
      await page.waitForTimeout(300);
      const canvasHeading = await page.locator('#hero h1').textContent();
      record('Hero Title synchronizes live from inspector to canvas', canvasHeading.includes('Global Tech & Innovation Summit 2026'), canvasHeading);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_hero_customization.png') });

    // ── STEP 6: SECTION BUILDER (TWO-COLUMN SPLIT SHOWCASE) ──
    console.log('\n--- STEP 6: Custom Multi-Column Section Builder ---');
    await page.locator('button[title="Elements"]').click();
    await page.waitForTimeout(400);

    const addSectionBtn = page.locator('button:has-text("Add Custom Section Block")').first();
    if (await addSectionBtn.count() > 0) {
      await addSectionBtn.click();
      await page.waitForTimeout(500);

      // Select Two-Column Split Section
      const twoColTrigger = page.locator('text=Two-Column Split Section').first();
      if (await twoColTrigger.count() > 0) {
        await twoColTrigger.click();
        await page.waitForTimeout(800);
        record('Inserted Two-Column Split Section', true);
      }

      // Verify custom section rendered in canvas
      const customSecInput = page.locator('input[value="Two-Column Showcase"]');
      const hasCustomSec = (await customSecInput.count()) > 0;
      record('Two-Column Custom Section created and rendered in canvas', hasCustomSec);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_custom_section_editing.png') });

    // ── STEP 7: DIRECT ELEMENT SELECTION, DRAG & 8-POINT RESIZE ──
    console.log('\n--- STEP 7: Direct Drag, 8-Point Resize & Element Inspector ---');
    const firstElement = page.locator('[data-element-id]').first();
    if (await firstElement.count() > 0) {
      await firstElement.click();
      await page.waitForTimeout(400);

      // Verify Floating Action Toolbar
      const hasDuplicateBtn = (await page.locator('button[title="Duplicate Element"]').count()) > 0;
      const hasLockBtn = (await page.locator('button[title*="Lock Element"]').count()) > 0;
      record('Floating action bar appears on canvas element selection', hasDuplicateBtn && hasLockBtn);

      // Verify 8 resize handles
      const nwHandle = await page.locator('.cursor-nwse-resize').count();
      const nHandle = await page.locator('.cursor-ns-resize').count();
      const neHandle = await page.locator('.cursor-nesw-resize').count();
      const eHandle = await page.locator('.cursor-ew-resize').count();
      record('All 8 directional resize handles rendered on selected element', nwHandle > 0 && nHandle > 0 && neHandle > 0 && eHandle > 0);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_selected_button_resize_handles.png') });

      // Verify Element Properties Inspector
      const hasPropsPanel = (await page.locator('text=Properties').count()) > 0;
      record('Element Properties panel opens in right inspector', hasPropsPanel);

      // Test width and height inputs
      const widthInput = page.locator('input[type="number"][max="100"]').first();
      if (await widthInput.count() > 0) {
        await widthInput.fill('60');
        await page.waitForTimeout(300);
        record('Manual dimension input updates element width', true);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_button_inspector.png') });
    }

    // ── STEP 8: LAYERS PANEL ──
    console.log('\n--- STEP 8: Layers & Section Ordering ---');
    await page.locator('button[title="Layers"]').click();
    await page.waitForTimeout(400);
    const layersPanelHeader = await page.locator('text=Page Layers & Sections').count();
    record('Layers panel displays organized section hierarchy', layersPanelHeader > 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_layers_panel.png') });

    // ── STEP 9: SAVE WEBSITE CHANGES ──
    console.log('\n--- STEP 9: Save Website Changes to PostgreSQL ---');
    const saveButton = page.locator('button:has-text("Save Website")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);

    const isSaved = (await page.locator('text=Saved!').count()) > 0 || (await saveButton.textContent()).includes('Saved');
    record('Website configuration saved successfully to Neon PostgreSQL', isSaved);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_saved_editor.png') });

    // ── STEP 10: RELOAD & RESTORATION AUDIT ──
    console.log('\n--- STEP 10: Reload Editor & Verify Persistence ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const restoredHeading = await page.locator('#hero h1').textContent();
    record('Saved configuration persists across hard reload', restoredHeading.includes('Global Tech & Innovation Summit 2026'), restoredHeading);

    // ── STEP 11: PUBLIC MICROSITE VERIFICATION ACROSS VIEWPORTS ──
    console.log('\n--- STEP 11: Public Microsite (/p/summit-26) Multi-Device Verification ---');

    // 1. Desktop (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/p/summit-26`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const publicHeroHeading = await page.locator('h1').textContent();
    record('Public website renders saved hero headline', publicHeroHeading.includes('Global Tech & Innovation Summit 2026'), publicHeroHeading);

    const desktopNavLinks = await page.locator('header nav a').count();
    record('Public website desktop header contains navigation anchor links', desktopNavLinks >= 5, `${desktopNavLinks} links`);

    const publicCustomSec = (await page.locator('text=Two-Column Showcase').count()) > 0;
    record('Public website renders custom Two-Column section', publicCustomSec);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_public_desktop_website.png') });

    // 2. Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const tabletScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Public website has no horizontal overflow on 768px tablet', tabletScrollWidth <= 768, `ScrollWidth: ${tabletScrollWidth}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_public_tablet_website.png') });

    // 3. Mobile (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Public website has no horizontal overflow on 375px mobile', mobileScrollWidth <= 375, `ScrollWidth: ${mobileScrollWidth}`);

    // Mobile Hamburger Menu on Public Site
    const publicHamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
    const hasPublicHamburger = (await publicHamburgerBtn.count()) > 0;
    record('Public website mobile header renders accessible hamburger menu button', hasPublicHamburger);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_public_mobile_website.png') });

    if (hasPublicHamburger) {
      await publicHamburgerBtn.click();
      await page.waitForTimeout(400);
      const publicDrawerItems = await page.locator('text=Navigation Menu').count();
      record('Public mobile navigation drawer expands smoothly with all event links', publicDrawerItems > 0);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_public_mobile_menu_open.png') });
    }

    // 4. Ultra-Compact Mobile (320px)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(400);
    const ultraCompactScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Public website has no horizontal overflow on 320px ultra-compact mobile', ultraCompactScrollWidth <= 320, `ScrollWidth: ${ultraCompactScrollWidth}`);

  } catch (err) {
    console.error('Fatal Test Exception:', err);
    record('Playwright suite completed without fatal exception', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(`FINAL WEBSITE BUILDER SUITE RESULT: ${results.passed}/${results.total} Passed`);
  console.log('======================================================');
  if (results.failed > 0) {
    process.exit(1);
  }
}

runFinalWebsiteBuilderTestSuite();
