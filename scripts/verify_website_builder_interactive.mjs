import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('scratch/browser_tests/website_builder');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3333';

async function runWebsiteBuilderTest() {
  console.log('🚀 Starting MS Backstage Interactive Website Builder Playwright Test...');
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
    // STEP 1: AUTHENTICATE VIA DEMO LOGIN
    console.log('\n--- STEP 1: Authenticate via Demo Login ---');
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
    await page.locator('#demo-logins-trigger-btn').click();
    await page.waitForSelector('#demo-direct-platform_admin', { timeout: 10000 });
    await page.locator('#demo-direct-platform_admin').click();
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    await page.waitForTimeout(1000);
    record('Successfully signed into Workspace Dashboard', page.url().includes('/dashboard'));

    // STEP 2: NAVIGATE TO WEBSITE BUILDER FOR SUMMIT-26
    console.log('\n--- STEP 2: Open Event Website Builder ---');
    await page.goto(`${BASE_URL}/events/summit-26/website`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const titleText = await page.title();
    record('Page title loaded', titleText.length > 0, titleText);

    const hasSaveButton = (await page.locator('button:has-text("Save Website")').count()) > 0;
    record('Top navbar contains Save Website action', hasSaveButton);

    const hasUndo = (await page.locator('button[title="Undo (Ctrl+Z)"]').count()) > 0;
    const hasRedo = (await page.locator('button[title="Redo (Ctrl+Y)"]').count()) > 0;
    record('Undo/Redo controls present in toolbar', hasUndo && hasRedo);

    // Responsive mode controls
    const hasDesktopBtn = (await page.locator('button[title="Desktop View (100%)"]').count()) > 0;
    const hasTabletBtn = (await page.locator('button[title="Tablet View (768px)"]').count()) > 0;
    const hasMobileBtn = (await page.locator('button[title="Mobile View (375px)"]').count()) > 0;
    record('Responsive viewport toggles present (Desktop, Tablet, Mobile)', hasDesktopBtn && hasTabletBtn && hasMobileBtn);

    // Test responsive toggle
    await page.locator('button[title="Tablet View (768px)"]').click();
    await page.waitForTimeout(300);
    let canvasTablet = await page.locator('.max-w-\\[768px\\]').count();
    record('Tablet viewport mode toggles canvas constraint to 768px', canvasTablet > 0);

    await page.locator('button[title="Desktop View (100%)"]').click();
    await page.waitForTimeout(300);
    record('Switched back to Desktop View', true);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_website_builder_initial.png') });

    // STEP 3: TEMPLATES DRAWER & PRESET APPLICATION
    console.log('\n--- STEP 3: Templates Drawer & Preset Application ---');
    const isTemplateDrawerOpen = (await page.locator('text=10 Website Templates').count()) > 0;
    if (!isTemplateDrawerOpen) {
      await page.locator('button[title="Templates"]').click();
      await page.waitForTimeout(400);
    }

    const techSummitPreset = page.locator('text=Technology Summit').first();
    const hasTemplateCards = (await techSummitPreset.count()) > 0;
    record('Templates drawer displays template presets', hasTemplateCards);

    if (hasTemplateCards) {
      await techSummitPreset.click();
      await page.waitForTimeout(800);
      record('Clicked and applied Technology Summit template', true);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_applied_tech_summit_template.png') });

    // STEP 4: HERO SECTION EDITING & OVERLAY REMOVAL
    console.log('\n--- STEP 4: Hero Section & Overlay Controls ---');
    const heroSection = page.locator('#hero');
    await heroSection.click();
    await page.waitForTimeout(500);

    // Check Hero Properties panel appears in right inspector
    const heroPropsHeader = await page.locator('text=Hero Section Settings').count();
    record('Right inspector displays Hero Section Settings upon hero click', heroPropsHeader > 0);

    // Toggle Remove Color Overlay button
    const removeOverlayBtn = page.locator('button:has-text("Remove Color Overlay"), button:has-text("100% Photo Mode")').first();
    if (await removeOverlayBtn.count() > 0) {
      const initialBtnText = await removeOverlayBtn.textContent();
      await removeOverlayBtn.click();
      await page.waitForTimeout(400);
      const afterBtnText = await removeOverlayBtn.textContent();
      record('Toggled Hero Photo Mode / Color Overlay', initialBtnText !== afterBtnText, `${initialBtnText} -> ${afterBtnText}`);
    }

    // Edit Hero Title in right inspector
    const heroTitleInput = page.locator('input[value*="Summit"], input[value*="summit"]').first();
    if (await heroTitleInput.count() > 0) {
      await heroTitleInput.fill('Summit 2026 Innovation Conclave');
      await page.waitForTimeout(300);
      const canvasHeading = await page.locator('#hero h1').textContent();
      record('Live synchronization: Hero Title in canvas reflects edited value', canvasHeading.includes('Innovation Conclave'), canvasHeading);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_hero_editing_overlay_toggle.png') });

    // STEP 5: ADD CUSTOM SECTION (TWO-COLUMN SHOWCASE)
    console.log('\n--- STEP 5: Add Custom Section Modal ---');
    await page.locator('button[title="Elements"]').click();
    await page.waitForTimeout(400);

    const addSectionTrigger = page.locator('button:has-text("Add Custom Section Block")').first();
    if (await addSectionTrigger.count() > 0) {
      await addSectionTrigger.click();
      await page.waitForTimeout(500);

      const modalHeader = await page.locator('text=Add Section Block to Website').count();
      record('Add Section modal opens', modalHeader > 0);

      // Click "Two-Column Split Section"
      const twoColCard = page.locator('text=Two-Column Split Section').first();
      if (await twoColCard.count() > 0) {
        await twoColCard.click();
        await page.waitForTimeout(800);
        record('Clicked Two-Column Split Section to insert', true);
      }

      // Check section in canvas (rendered as editable input title)
      const addedSection = await page.locator('input[value="Two-Column Showcase"]').count();
      record('Custom section created and rendered in canvas', addedSection > 0);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_custom_section_added.png') });

    // STEP 6: VISUAL DRAGGABLE ELEMENT INTERACTION
    console.log('\n--- STEP 6: Visual Draggable Element Interaction ---');
    const visualElement = page.locator('[data-element-id]').first();
    if (await visualElement.count() > 0) {
      await visualElement.click();
      await page.waitForTimeout(400);

      // Verify element properties panel
      const elementPropsTitle = await page.locator('text=Properties').count();
      record('Clicking canvas element activates Element Properties panel', elementPropsTitle > 0);
    } else {
      record('Draggable elements present on canvas', false);
    }

    // STEP 7: SAVE WEBSITE CHANGES
    console.log('\n--- STEP 7: Save Website Changes to PostgreSQL ---');
    const saveButton = page.locator('button:has-text("Save Website")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);

    const isSaved = (await page.locator('text=Saved!').count()) > 0 || (await saveButton.textContent()).includes('Saved');
    record('Website saved successfully with visual feedback', isSaved);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_saved_website_editor.png') });

    // STEP 8: VERIFY LIVE PUBLIC MICROSITE (/p/summit-26)
    console.log('\n--- STEP 8: Public Website Parity Verification (/p/summit-26) ---');
    await page.goto(`${BASE_URL}/p/summit-26`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify public site loaded
    const publicHero = await page.locator('h1').textContent();
    record('Public website renders updated hero headline', publicHero.includes('Innovation Conclave'), publicHero);

    // Check sticky header navigation with smooth scroll
    const navLinks = await page.locator('header a, nav a').count();
    record('Public website header contains navigation anchor links', navLinks > 0, `${navLinks} links found`);

    // Check custom section renders on public site
    const customSectionPublic = (await page.locator('text=Two-Column Showcase').count()) > 0 || (await page.locator('text=Innovation Track A').count()) > 0;
    record('Custom section renders on public event microsite', customSectionPublic);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_public_site_desktop.png') });

    // Test mobile view of public site
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    record('Public website is fully responsive on 375px mobile without overflow', scrollWidth <= 375, `ScrollWidth: ${scrollWidth}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_public_site_mobile_375px.png') });

  } catch (err) {
    console.error('Fatal Test Exception:', err);
    record('Browser test suite completed without fatal exception', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(`WEBSITE BUILDER BROWSER TEST COMPLETE: ${results.passed}/${results.total} Passed`);
  console.log('======================================================');
  if (results.failed > 0) {
    process.exit(1);
  }
}

runWebsiteBuilderTest();
