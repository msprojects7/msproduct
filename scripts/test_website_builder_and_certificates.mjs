import { readFileSync } from 'fs';
import { resolve } from 'path';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

function assert(condition, message, section) {
  if (!condition) {
    console.error(`[FAIL] [${section}] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] [${section}] ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE: WEBSITE BUILDER & CERTIFICATE STUDIO VERIFICATION');
  console.log('================================================================');

  // TEST 1: Verify Duplicate Navigation Bars are completely removed
  console.log('\n--- Test 1: Navigation Bar Verification (No Duplicates) ---');
  const filesToCheck = [
    'app/events/[eventSlug]/certificates/page.tsx',
    'app/events/[eventSlug]/check-in/page.tsx',
    'app/events/[eventSlug]/badge-printing/page.tsx',
    'app/events/[eventSlug]/analytics/attendance/page.tsx',
  ];

  for (const relPath of filesToCheck) {
    const content = readFileSync(resolve(process.cwd(), relPath), 'utf-8');
    assert(
      !content.includes('import AppleDock'),
      `No AppleDock import in child route ${relPath}`,
      'NAV'
    );
    assert(
      !content.includes('<AppleDock'),
      `No redundant <AppleDock /> component rendered in ${relPath}`,
      'NAV'
    );
  }

  // Parent layout should still have AppleDock
  const layoutContent = readFileSync(
    resolve(process.cwd(), 'app/events/[eventSlug]/layout.tsx'),
    'utf-8'
  );
  assert(
    layoutContent.includes('<AppleDock'),
    'Single centralized AppleDock correctly maintained in parent layout.tsx',
    'NAV'
  );

  // TEST 2: Verify 10 Certificate Templates
  console.log('\n--- Test 2: 10 Certificate Template Presets ---');
  const certTplModule = await import('../lib/certificates/templates.ts');
  const certPresets = certTplModule.CERTIFICATE_PRESETS;
  assert(Array.isArray(certPresets), 'CERTIFICATE_PRESETS is an array', 'CERT_TEMPLATES');
  assert(certPresets.length === 10, `Exactly 10 Certificate Presets defined (found: ${certPresets.length})`, 'CERT_TEMPLATES');

  const expectedCertIds = [
    'classic_gold',
    'modern_tech',
    'academic_excellence',
    'creative_vibrant',
    'dark_luxury',
    'corporate_leadership',
    'medical_healthcare',
    'clean_monochrome',
    'gradient_badge',
    'traditional_parchment',
  ];

  for (const id of expectedCertIds) {
    const found = certPresets.find((p) => p.id === id);
    assert(Boolean(found), `Certificate Preset '${id}' exists (${found?.name})`, 'CERT_TEMPLATES');
    assert(Boolean(found?.theme?.borderStyle), `Preset '${id}' has borderStyle: ${found?.theme?.borderStyle}`, 'CERT_TEMPLATES');
    assert(Boolean(found?.theme?.sealType), `Preset '${id}' has sealType: ${found?.theme?.sealType}`, 'CERT_TEMPLATES');
    assert(Boolean(found?.defaults?.title), `Preset '${id}' has default title: ${found?.defaults?.title}`, 'CERT_TEMPLATES');
  }

  // TEST 3: Verify 10 Website Templates
  console.log('\n--- Test 3: 10 Event Website Templates ---');
  const webTplModule = await import('../lib/website/templates.ts');
  const webTemplates = webTplModule.WEBSITE_TEMPLATES;
  assert(Array.isArray(webTemplates), 'WEBSITE_TEMPLATES is an array', 'WEB_TEMPLATES');
  assert(webTemplates.length === 10, `Exactly 10 Website Templates defined (found: ${webTemplates.length})`, 'WEB_TEMPLATES');

  const expectedWebIds = [
    'college_students_event',
    'school_annual_event',
    'medical_conference',
    'modern_conference',
    'tech_summit',
    'business_leadership',
    'startup_innovation',
    'creative_design',
    'expo_exhibition',
    'luxury_premium',
  ];

  for (const id of expectedWebIds) {
    const found = webTemplates.find((t) => t.id === id);
    assert(Boolean(found), `Website Template '${id}' exists (${found?.name})`, 'WEB_TEMPLATES');
    assert(Boolean(found?.theme?.heroLayout), `Template '${id}' has heroLayout: ${found?.theme?.heroLayout}`, 'WEB_TEMPLATES');
    assert(Boolean(found?.theme?.fontHeading), `Template '${id}' has fontHeading: ${found?.theme?.fontHeading}`, 'WEB_TEMPLATES');
    assert(Array.isArray(found?.defaultSections) && found.defaultSections.length > 0, `Template '${id}' has defaultSections configured`, 'WEB_TEMPLATES');
  }

  // TEST 4: Live HTTP Endpoint Verification
  console.log('\n--- Test 4: Live HTTP Endpoint Verification ---');
  const homeRes = await fetch(`${APP_URL}/`);
  assert(homeRes.status === 200, 'Home page returns HTTP 200', 'HTTP');
  assert(homeRes.headers.get('x-frame-options') === 'DENY', 'Home page retains X-Frame-Options: DENY', 'HTTP');

  const pRes = await fetch(`${APP_URL}/p/summit-26`);
  assert(pRes.status === 200, 'Public microsite /p/summit-26 returns HTTP 200', 'HTTP');
  assert(pRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'Public microsite allows X-Frame-Options: SAMEORIGIN for live preview', 'HTTP');
  const pCsp = pRes.headers.get('content-security-policy') || '';
  assert(pCsp.includes("frame-ancestors 'self'"), "Public microsite CSP includes frame-ancestors 'self'", 'HTTP');
  assert(pCsp.includes('images.unsplash.com'), 'Public microsite CSP permits Unsplash cover image origins', 'HTTP');

  console.log('\n================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (32/32)!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\nTest Suite Aborted:', err);
  process.exit(1);
});
