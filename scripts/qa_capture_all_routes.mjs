import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3333';
const EVIDENCE_BASE = path.resolve('scratch/qa_evidence');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'tablet', width: 768, height: 1024, isMobile: false },
  { name: 'mobile', width: 375, height: 812, isMobile: true },
];

const ROUTES = [
  { id: '01_home', path: '/', name: 'Landing Homepage', isPublic: true },
  { id: '02_features', path: '/features', name: 'Product Features', isPublic: true },
  { id: '03_pricing', path: '/pricing', name: 'Pricing Plans', isPublic: true },
  { id: '04_auth_signin', path: '/auth/sign-in', name: 'Sign In Page', isPublic: true },
  { id: '05_auth_signup', path: '/auth/sign-up', name: 'Sign Up Page', isPublic: true },
  { id: '06_auth_forgot_password', path: '/auth/forgot-password', name: 'Forgot Password', isPublic: true },
  { id: '07_auth_reset_password', path: '/auth/reset-password?token=demo-token', name: 'Reset Password Form', isPublic: true },
  { id: '08_auth_signout', path: '/auth/sign-out', name: 'Sign Out Page', isPublic: false },
  { id: '09_invitations_accept', path: '/invitations/accept?token=demo-invite', name: 'Accept Invitation', isPublic: false },
  { id: '10_dashboard', path: '/dashboard', name: 'Global Dashboard', isPublic: false },
  { id: '11_organizations', path: '/organizations', name: 'Organizations Directory', isPublic: false },
  { id: '12_organizations_new', path: '/organizations/new', name: 'Create Organization', isPublic: false },
  { id: '13_org_overview', path: '/organizations/conference', name: 'Organization Console', isPublic: false },
  { id: '14_org_settings', path: '/organizations/conference/settings', name: 'Organization Settings', isPublic: false },
  { id: '15_org_members', path: '/organizations/conference/members', name: 'Organization Members', isPublic: false },
  { id: '16_org_invitations', path: '/organizations/conference/invitations', name: 'Organization Invitations', isPublic: false },
  { id: '17_org_events_new', path: '/organizations/conference/events/new', name: 'Create Event in Org', isPublic: false },
  { id: '18_event_console', path: '/events/summit-26', name: 'Event Management Console', isPublic: false },
  { id: '19_event_settings', path: '/events/summit-26/settings', name: 'Event Settings', isPublic: false },
  { id: '20_event_staff', path: '/events/summit-26/staff', name: 'Event Staff Directory', isPublic: false },
  { id: '21_event_staff_new', path: '/events/summit-26/staff/new', name: 'Add Event Staff Member', isPublic: false },
  { id: '22_event_audit', path: '/events/summit-26/audit', name: 'Event Security & Scan Audit', isPublic: false },
  { id: '23_event_speakers', path: '/events/summit-26/speakers', name: 'Event Speakers Directory', isPublic: false },
  { id: '24_event_agenda', path: '/events/summit-26/agenda', name: 'Event Agenda & Schedule', isPublic: false },
  { id: '25_event_sponsors', path: '/events/summit-26/sponsors', name: 'Event Sponsors & Exhibitors', isPublic: false },
  { id: '26_event_tickets', path: '/events/summit-26/tickets', name: 'Ticket Types & Pricing', isPublic: false },
  { id: '27_event_promocodes', path: '/events/summit-26/promo-codes', name: 'Event Promo Codes', isPublic: false },
  { id: '28_event_reg_forms', path: '/events/summit-26/registration-forms', name: 'Registration Form Builder', isPublic: false },
  { id: '29_event_registrations', path: '/events/summit-26/registrations', name: 'Event Orders & Registrations', isPublic: false },
  { id: '30_event_website_studio', path: '/events/summit-26/website', name: 'Visual Website Builder Studio', isPublic: false },
  { id: '31_event_checkin', path: '/events/summit-26/check-in', name: 'Onsite Check-in Desk', isPublic: false },
  { id: '32_event_kiosk', path: '/events/summit-26/kiosk', name: 'Self-Service Attendee Kiosk', isPublic: false },
  { id: '33_event_badge_printing', path: '/events/summit-26/badge-printing', name: 'Live Badge Printing Desk', isPublic: false },
  { id: '34_event_certificates', path: '/events/summit-26/certificates', name: 'Certificates Studio & Generation', isPublic: false },
  { id: '35_event_analytics_attendance', path: '/events/summit-26/analytics/attendance', name: 'Attendance Analytics', isPublic: false },
  { id: '36_event_attendees', path: '/events/summit-26/attendees', name: 'Attendees Directory & PII', isPublic: false },
  { id: '37_event_spot_reg', path: '/events/summit-26/spot-registration', name: 'Spot Registration Desk', isPublic: false },
  { id: '38_event_scanner', path: '/events/summit-26/scanner', name: 'Camera & QR Scanner Desk', isPublic: false },
  { id: '39_event_badges', path: '/events/summit-26/badges', name: 'Badges Management & Queue', isPublic: false },
  { id: '40_event_badges_designer', path: '/events/summit-26/badges/designer', name: 'Badge Visual Canvas Designer', isPublic: false },
  { id: '41_event_reports', path: '/events/summit-26/reports', name: 'Operational & Financial Reports', isPublic: false },
  { id: '42_event_import', path: '/events/summit-26/import', name: 'CSV Attendee Batch Import', isPublic: false },
  { id: '43_event_zones', path: '/events/summit-26/zones', name: 'Security Zones & Access Control', isPublic: false },
  { id: '44_microsite_home', path: '/p/summit-26', name: 'Public Event Microsite', isPublic: true },
  { id: '45_microsite_subpage', path: '/p/summit-26/about', name: 'Public Microsite Subpage (About)', isPublic: true },
  { id: '46_microsite_register', path: '/p/summit-26/register', name: 'Public Registration & Checkout', isPublic: true },
  { id: '47_microsite_confirmation', path: '/p/summit-26/confirmation/DEMO-ORDER-001', name: 'Order Confirmation Page', isPublic: true },
  { id: '48_attendee_portal', path: '/p/summit-26/attendee', name: 'Attendee Self-Service Portal', isPublic: true },
  { id: '49_certificate_verify', path: '/verify/DEMO-VERIFY-001', name: 'Public Certificate Verification', isPublic: true },
];

async function captureAllRoutes() {
  console.log('========================================================================');
  console.log('MS BACKSTAGE: COMPREHENSIVE 49-ROUTE 3-VIEWPORT SCREENSHOT & AUDIT SUITE');
  console.log('========================================================================');

  for (const vp of VIEWPORTS) {
    const dir = path.join(EVIDENCE_BASE, vp.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const auditResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`>>> VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) <<<`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Collect console & network logs
    const consoleLogs = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push({ type: 'error', text: msg.text() });
      } else if (msg.type() === 'warning') {
        consoleLogs.push({ type: 'warning', text: msg.text() });
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown failure',
      });
    });

    // 1. Authenticate once per viewport context
    console.log(`[AUTH] Authenticating as Platform Admin in ${vp.name}...`);
    try {
      await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      const demoBtn = page.locator('#demo-logins-trigger-btn');
      if (await demoBtn.isVisible()) {
        await demoBtn.click();
        await page.waitForSelector('#demo-direct-platform_admin', { timeout: 8000 });
        await page.locator('#demo-direct-platform_admin').click();
        await page.waitForURL('**/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
        console.log(`[AUTH] Successfully logged in! Context authenticated.`);
      } else {
        console.warn(`[AUTH] Demo logins button not found on sign-in page.`);
      }
    } catch (e) {
      console.warn(`[AUTH] Direct login bypass attempt error: ${e.message}`);
    }

    // 2. Iterate each route
    for (const r of ROUTES) {
      const fullUrl = `${BASE_URL}${r.path}`;
      const screenshotFilename = `${r.id}_${vp.name}.png`;
      const screenshotFilePath = path.join(EVIDENCE_BASE, vp.name, screenshotFilename);

      const routeRecord = {
        routeId: r.id,
        name: r.name,
        path: r.path,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        screenshotFile: path.join('scratch/qa_evidence', vp.name, screenshotFilename),
        httpStatus: 0,
        overflow: false,
        scrollWidth: 0,
        clientWidth: 0,
        consoleErrors: [],
        networkErrors: [],
        status: 'PENDING',
      };

      // Reset route-specific logs
      const startConsoleCount = consoleLogs.length;
      const startNetworkCount = networkErrors.length;

      try {
        const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(800); // Allow react hydration and animations to settle

        routeRecord.httpStatus = response ? response.status() : 200;

        // Check horizontal overflow
        const overflowMetrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const clientW = docEl.clientWidth;
          return {
            scrollWidth: scrollW,
            clientWidth: clientW,
            hasOverflow: scrollW > clientW + 2, // 2px margin of tolerance for browser scrollbars
          };
        });

        routeRecord.overflow = overflowMetrics.hasOverflow;
        routeRecord.scrollWidth = overflowMetrics.scrollWidth;
        routeRecord.clientWidth = overflowMetrics.clientWidth;

        // Capture screenshot
        await page.screenshot({ path: screenshotFilePath, fullPage: true });

        // Gather errors that happened during this route
        routeRecord.consoleErrors = consoleLogs.slice(startConsoleCount).map(c => c.text);
        routeRecord.networkErrors = networkErrors.slice(startNetworkCount).map(n => `${n.url} (${n.error})`);

        if (routeRecord.httpStatus < 400 && !routeRecord.overflow) {
          routeRecord.status = 'PASS';
          console.log(`✓ [${vp.name.toUpperCase()}] ${r.id}: ${r.name} (${routeRecord.httpStatus}) — No overflow`);
        } else if (routeRecord.httpStatus < 400 && routeRecord.overflow) {
          routeRecord.status = 'WARN';
          console.log(`⚠ [${vp.name.toUpperCase()}] ${r.id}: ${r.name} (${routeRecord.httpStatus}) — OVERFLOW: ${routeRecord.scrollWidth}px > ${routeRecord.clientWidth}px`);
        } else {
          routeRecord.status = 'FAIL';
          console.log(`✗ [${vp.name.toUpperCase()}] ${r.id}: ${r.name} — Status ${routeRecord.httpStatus}`);
        }
      } catch (err) {
        routeRecord.status = 'ERROR';
        routeRecord.errorMessage = err.message;
        console.error(`✗ [${vp.name.toUpperCase()}] ${r.id}: ${r.name} — Error: ${err.message}`);
        try {
          await page.screenshot({ path: screenshotFilePath, fullPage: false });
        } catch (_) {}
      }

      auditResults.push(routeRecord);
    }

    await context.close();
  }

  await browser.close();

  // Save raw JSON audit
  fs.writeFileSync(path.join(EVIDENCE_BASE, 'routes_audit.json'), JSON.stringify(auditResults, null, 2));

  // Generate Reports
  generateScreenshotCoverageReport(auditResults);
  generateScreenshotHtmlIndex(auditResults);

  console.log('\n========================================================================');
  console.log('SCREENSHOT & AUDIT SUITE COMPLETED SUCCESSFULLY');
  console.log(`Saved ${auditResults.length} audits and screenshots.`);
  console.log('========================================================================');
}

function generateScreenshotCoverageReport(results) {
  let md = `# MS Backstage — Comprehensive Screenshot & Responsive Audit Coverage

**Audit Timestamp:** ${new Date().toISOString()}  
**Total Routes Audited:** ${ROUTES.length}  
**Viewports Audited:** Desktop (1440x900), Tablet (768x1024), Mobile (375x812)  
**Total Screenshots Captured:** ${results.length}  
**Evidence Storage:** \`scratch/qa_evidence/\`

---

## 1. Summary by Viewport

`;

  for (const vp of VIEWPORTS) {
    const vpResults = results.filter(r => r.viewport === vp.name);
    const passCount = vpResults.filter(r => r.status === 'PASS').length;
    const warnCount = vpResults.filter(r => r.status === 'WARN').length;
    const failCount = vpResults.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
    md += `### ${vp.name.toUpperCase()} (${vp.width}x${vp.height})
- **Total Tested:** ${vpResults.length}
- **PASS (Clean render, zero horizontal overflow):** ${passCount}
- **WARNING (Minor overflow or layout observation):** ${warnCount}
- **FAIL / ERROR:** ${failCount}
- **Pass Rate:** ${((passCount / vpResults.length) * 100).toFixed(1)}%

`;
  }

  md += `---

## 2. Complete 49-Route Verification Matrix

| # | Route ID | Route Name | URL Path | Desktop (1440px) | Tablet (768px) | Mobile (375px) | HTTP Status | Overflow Status |
|---|---|---|---|---|---|---|---|---|
`;

  ROUTES.forEach((r, idx) => {
    const dRec = results.find(x => x.routeId === r.id && x.viewport === 'desktop');
    const tRec = results.find(x => x.routeId === r.id && x.viewport === 'tablet');
    const mRec = results.find(x => x.routeId === r.id && x.viewport === 'mobile');

    const dStatus = dRec ? (dRec.status === 'PASS' ? '✅ PASS' : dRec.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL') : 'N/A';
    const tStatus = tRec ? (tRec.status === 'PASS' ? '✅ PASS' : tRec.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL') : 'N/A';
    const mStatus = mRec ? (mRec.status === 'PASS' ? '✅ PASS' : mRec.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL') : 'N/A';

    const httpCode = dRec ? dRec.httpStatus : 200;
    const overflowInfo = mRec && mRec.overflow ? `Mobile: ${mRec.scrollWidth}px > ${mRec.clientWidth}px` : 'None';

    md += `| ${idx + 1} | \`${r.id}\` | ${r.name} | \`${r.path}\` | ${dStatus} | ${tStatus} | ${mStatus} | ${httpCode} | ${overflowInfo} |\n`;
  });

  md += `
---

## 3. Visual Artifact Links & Verification Files
- **Screenshot Gallery (Interactive HTML):** [\`reports/QA_SCREENSHOT_INDEX.html\`](file:///Users/suryakumar/Desktop/ms%20product/reports/QA_SCREENSHOT_INDEX.html)
- **Desktop Screenshots Folder:** [\`scratch/qa_evidence/desktop/\`](file:///Users/suryakumar/Desktop/ms%20product/scratch/qa_evidence/desktop/)
- **Tablet Screenshots Folder:** [\`scratch/qa_evidence/tablet/\`](file:///Users/suryakumar/Desktop/ms%20product/scratch/qa_evidence/tablet/)
- **Mobile Screenshots Folder:** [\`scratch/qa_evidence/mobile/\`](file:///Users/suryakumar/Desktop/ms%20product/scratch/qa_evidence/mobile/)
- **Raw Audit JSON Data:** [\`scratch/qa_evidence/routes_audit.json\`](file:///Users/suryakumar/Desktop/ms%20product/scratch/qa_evidence/routes_audit.json)
`;

  fs.writeFileSync(path.resolve('reports/QA_SCREENSHOT_COVERAGE.md'), md);
  console.log(`[REPORT] Generated reports/QA_SCREENSHOT_COVERAGE.md`);
}

function generateScreenshotHtmlIndex(results) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MS Backstage — Comprehensive Screenshot & Visual Evidence Index</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #1f2937; }
    h1 { font-size: 24px; margin: 0 0 8px 0; color: #60a5fa; }
    p { margin: 4px 0; color: #9ca3af; font-size: 14px; }
    .filters { display: flex; gap: 12px; margin: 20px 0; }
    button { background: #1e293b; color: #f3f4f6; border: 1px solid #334155; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
    button.active { background: #2563eb; border-color: #3b82f6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
    .card-header { padding: 12px 16px; background: #161e2e; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; }
    .card-title { font-weight: 600; font-size: 14px; color: #e5e7eb; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .badge-pass { background: #065f46; color: #34d399; }
    .badge-warn { background: #78350f; color: #fbbf24; }
    .badge-fail { background: #881337; color: #f87171; }
    .card-meta { padding: 8px 16px; font-size: 12px; color: #9ca3af; border-bottom: 1px solid #1f2937; background: #0f172a; }
    .card-img-container { flex: 1; min-height: 220px; max-height: 300px; overflow: hidden; background: #000; position: relative; }
    .card img { width: 100%; height: auto; display: block; }
    .card-footer { padding: 8px 16px; font-size: 12px; display: flex; justify-content: space-between; background: #161e2e; border-top: 1px solid #1f2937; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <h1>MS Backstage — Visual Screenshot Index & Responsive Verification</h1>
    <p>Comprehensive automated Playwright evidence captured across Desktop (1440x900), Tablet (768x1024), and Mobile (375x812) viewports.</p>
    <p>Total Captures: <strong>${results.length}</strong> | Routes: <strong>${ROUTES.length}</strong> | Generated: <strong>${new Date().toLocaleString()}</strong></p>
    <div class="filters">
      <button class="active" onclick="filterViewport('all')">All Viewports</button>
      <button onclick="filterViewport('desktop')">Desktop (1440px)</button>
      <button onclick="filterViewport('tablet')">Tablet (768px)</button>
      <button onclick="filterViewport('mobile')">Mobile (375px)</button>
    </div>
  </header>

  <div class="grid" id="gallery">
`;

  results.forEach(item => {
    const badgeClass = item.status === 'PASS' ? 'badge-pass' : item.status === 'WARN' ? 'badge-warn' : 'badge-fail';
    const relativeImg = `../scratch/qa_evidence/${item.viewport}/${item.routeId}_${item.viewport}.png`;

    html += `
    <div class="card" data-viewport="${item.viewport}">
      <div class="card-header">
        <span class="card-title">${item.name}</span>
        <span class="badge ${badgeClass}">${item.status}</span>
      </div>
      <div class="card-meta">
        <div><strong>Path:</strong> <code>${item.path}</code></div>
        <div><strong>Viewport:</strong> ${item.viewport} (${item.width}x${item.height}) | <strong>HTTP:</strong> ${item.httpStatus}</div>
        ${item.overflow ? `<div style="color: #fbbf24;">⚠️ Overflow: ${item.scrollWidth}px (view: ${item.clientWidth}px)</div>` : ''}
      </div>
      <div class="card-img-container">
        <a href="${relativeImg}" target="_blank">
          <img src="${relativeImg}" alt="${item.name}" loading="lazy" />
        </a>
      </div>
      <div class="card-footer">
        <span>${item.routeId}</span>
        <a href="${relativeImg}" target="_blank">Open Full Image ↗</a>
      </div>
    </div>
`;
  });

  html += `
  </div>

  <script>
    function filterViewport(vp) {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const cards = document.querySelectorAll('.card');
      cards.forEach(c => {
        if (vp === 'all' || c.getAttribute('data-viewport') === vp) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.resolve('reports/QA_SCREENSHOT_INDEX.html'), html);
  console.log(`[REPORT] Generated reports/QA_SCREENSHOT_INDEX.html`);
}

captureAllRoutes().catch(err => {
  console.error('FATAL AUDIT ERROR:', err);
  process.exit(1);
});
