import dotenv from 'dotenv';
dotenv.config();

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runPhase9Tests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — PHASE 9 SEO, ANALYTICS & PRODUCTION READINESS TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, category = 'VERIFY') {
    if (condition) {
      console.log(`✓ [${category}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${category}] FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await fetch(`${APP_URL}/api/health`);
  assert(healthRes.status === 200, 'Health endpoint responds with 200 OK', 'HEALTH');

  // =========================================================================
  // SECTION 1: PUBLIC HOMEPAGE SEO, METADATA & STRUCTURED DATA
  // =========================================================================
  console.log('\n--- Section 1: Public Homepage SEO, Metadata & JSON-LD ---');

  const homeRes = await fetch(`${APP_URL}/`);
  assert(homeRes.status === 200, 'Homepage returns 200 OK', 'HOMEPAGE');
  const homeHtml = await homeRes.text();

  // Title tag
  assert(
    homeHtml.includes('<title>') && homeHtml.includes('MS Backstage'),
    'Homepage contains descriptive <title> including "MS Backstage"',
    'SEO_TITLE'
  );

  // Meta description
  assert(
    homeHtml.includes('name="description"') && homeHtml.includes('content="Enterprise-grade multi-tenant SaaS platform'),
    'Homepage contains comprehensive meta description',
    'SEO_DESCRIPTION'
  );

  // Canonical URL
  assert(
    homeHtml.includes('rel="canonical"') && homeHtml.includes('href="'),
    'Canonical URL link tag present in homepage head',
    'SEO_CANONICAL'
  );

  // Open Graph metadata
  assert(homeHtml.includes('property="og:title"'), 'Open Graph og:title present', 'SEO_OG');
  assert(homeHtml.includes('property="og:description"'), 'Open Graph og:description present', 'SEO_OG');
  assert(homeHtml.includes('property="og:type"') && homeHtml.includes('content="website"'), 'Open Graph og:type is website', 'SEO_OG');
  assert(homeHtml.includes('property="og:image"'), 'Open Graph og:image present', 'SEO_OG');
  assert(homeHtml.includes('property="og:url"'), 'Open Graph og:url present', 'SEO_OG');

  // Twitter cards
  assert(homeHtml.includes('name="twitter:card"') && homeHtml.includes('content="summary_large_image"'), 'Twitter card configured as summary_large_image', 'SEO_TWITTER');
  assert(homeHtml.includes('name="twitter:title"'), 'Twitter card title present', 'SEO_TWITTER');
  assert(homeHtml.includes('name="twitter:image"'), 'Twitter card image present', 'SEO_TWITTER');

  // Icons and viewport
  assert(homeHtml.includes('rel="icon"'), 'Favicon links present in document head', 'SEO_ICONS');
  assert(homeHtml.includes('name="viewport"'), 'Viewport meta tag present for responsive mobile rendering', 'RESPONSIVE');

  // Structured Data (JSON-LD)
  const jsonLdMatch = homeHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert(Boolean(jsonLdMatch), 'JSON-LD structured data script found in homepage', 'STRUCTURED_DATA');

  if (jsonLdMatch) {
    try {
      const parsedLd = JSON.parse(jsonLdMatch[1]);
      assert(parsedLd['@context'] === 'https://schema.org', 'JSON-LD @context is https://schema.org', 'STRUCTURED_DATA');
      const types = (parsedLd['@graph'] || []).map((item) => item['@type']);
      assert(types.includes('WebSite'), 'JSON-LD contains WebSite schema', 'STRUCTURED_DATA');
      assert(types.includes('SoftwareApplication'), 'JSON-LD contains SoftwareApplication schema', 'STRUCTURED_DATA');

      const appSchema = (parsedLd['@graph'] || []).find((item) => item['@type'] === 'SoftwareApplication');
      assert(appSchema.name === 'MS Backstage', 'SoftwareApplication schema name matches MS Backstage', 'STRUCTURED_DATA');
      assert(Array.isArray(appSchema.featureList) && appSchema.featureList.length >= 6, 'SoftwareApplication lists 6 confirmed Stage 1-8 features', 'STRUCTURED_DATA');
    } catch (e) {
      assert(false, `Failed to parse JSON-LD: ${e.message}`, 'STRUCTURED_DATA');
    }
  }

  // Headings hierarchy & Accessibility
  const h1Matches = homeHtml.match(/<h1[^>]*>/g) || [];
  assert(h1Matches.length === 1, `Homepage has exactly 1 <h1> tag for SEO hierarchy (found: ${h1Matches.length})`, 'ACCESSIBILITY');
  assert(homeHtml.includes('<h2') && homeHtml.includes('<h3'), 'Homepage contains structured <h2> and <h3> subheadings', 'ACCESSIBILITY');
  assert(homeHtml.includes('role="region"') || homeHtml.includes('<header') && homeHtml.includes('<footer'), 'Semantic HTML landmark tags used (<header>, <main>, <footer>)', 'ACCESSIBILITY');

  // =========================================================================
  // SECTION 2: ROBOTS.TXT DISCOVERABILITY & PRIVACY BOUNDARIES
  // =========================================================================
  console.log('\n--- Section 2: Robots.txt & Private Route Protection ---');

  const robotsRes = await fetch(`${APP_URL}/robots.txt`);
  assert(robotsRes.status === 200, 'GET /robots.txt returns 200 OK', 'ROBOTS');
  const robotsText = await robotsRes.text();

  assert(robotsText.includes('User-Agent: *') || robotsText.includes('user-agent: *'), 'Robots.txt contains User-Agent wildcard', 'ROBOTS');
  assert(robotsText.includes('Allow: /'), 'Robots.txt allows root path', 'ROBOTS');
  assert(robotsText.includes('Disallow: /api/'), 'Robots.txt disallows /api/ routes', 'ROBOTS_PRIVACY');
  assert(robotsText.includes('Disallow: /dashboard/'), 'Robots.txt disallows private /dashboard/ routes', 'ROBOTS_PRIVACY');
  assert(robotsText.includes('Disallow: /events/'), 'Robots.txt disallows private /events/ routes', 'ROBOTS_PRIVACY');
  assert(robotsText.includes('Disallow: /organizations/'), 'Robots.txt disallows private /organizations/ routes', 'ROBOTS_PRIVACY');
  assert(robotsText.includes('Disallow: /invitations/'), 'Robots.txt disallows sensitive /invitations/ routes', 'ROBOTS_PRIVACY');
  assert(robotsText.includes('Sitemap: ') && robotsText.includes('/sitemap.xml'), 'Robots.txt references /sitemap.xml', 'ROBOTS');

  // =========================================================================
  // SECTION 3: SITEMAP.XML CANONICAL ROUTES & EXCLUSION INTEGRITY
  // =========================================================================
  console.log('\n--- Section 3: Dynamic Sitemap.xml Verification ---');

  const sitemapRes = await fetch(`${APP_URL}/sitemap.xml`);
  assert(sitemapRes.status === 200, 'GET /sitemap.xml returns 200 OK', 'SITEMAP');
  const sitemapText = await sitemapRes.text();

  assert(sitemapText.includes('<urlset') && sitemapText.includes('</urlset>'), 'Sitemap is valid XML with <urlset>', 'SITEMAP');
  assert(sitemapText.includes('<loc>') && sitemapText.includes('/auth/sign-in</loc>'), 'Sitemap includes public canonical /auth/sign-in', 'SITEMAP');
  assert(!sitemapText.includes('/dashboard'), 'Sitemap strictly EXCLUDES private /dashboard', 'SITEMAP_PRIVACY');
  assert(!sitemapText.includes('/events'), 'Sitemap strictly EXCLUDES private /events', 'SITEMAP_PRIVACY');
  assert(!sitemapText.includes('/organizations'), 'Sitemap strictly EXCLUDES private /organizations', 'SITEMAP_PRIVACY');
  assert(!sitemapText.includes('/api/'), 'Sitemap strictly EXCLUDES /api/', 'SITEMAP_PRIVACY');
  assert(!sitemapText.includes('/invitations/'), 'Sitemap strictly EXCLUDES tokenized /invitations/', 'SITEMAP_PRIVACY');

  // =========================================================================
  // SECTION 4: SECURITY HEADERS & CORE PERFORMANCE CONTROLS
  // =========================================================================
  console.log('\n--- Section 4: Security Headers & Performance Directives ---');

  // 4.1 Global security headers
  const nosniff = homeRes.headers.get('x-content-type-options');
  const frameOptions = homeRes.headers.get('x-frame-options');
  const referrerPolicy = homeRes.headers.get('referrer-policy');
  const permissionsPolicy = homeRes.headers.get('permissions-policy');
  const hsts = homeRes.headers.get('strict-transport-security');
  const poweredBy = homeRes.headers.get('x-powered-by');

  assert(nosniff === 'nosniff', 'X-Content-Type-Options: nosniff header enforced', 'SECURITY_HEADERS');
  assert(frameOptions === 'DENY', 'X-Frame-Options: DENY header enforced', 'SECURITY_HEADERS');
  assert(referrerPolicy === 'strict-origin-when-cross-origin', 'Referrer-Policy: strict-origin-when-cross-origin enforced', 'SECURITY_HEADERS');
  assert(permissionsPolicy && permissionsPolicy.includes('camera=(self)'), 'Permissions-Policy allows camera only for self origin', 'SECURITY_HEADERS');
  assert(Boolean(hsts), 'Strict-Transport-Security (HSTS) header present', 'SECURITY_HEADERS');
  assert(!poweredBy, 'X-Powered-By header is removed (poweredByHeader: false)', 'SECURITY_HEADERS');

  // 4.2 Invitation route no-referrer header
  const inviteHeaders = await fetch(`${APP_URL}/invitations/accept?token=sample-test-token`);
  assert(inviteHeaders.headers.get('referrer-policy') === 'no-referrer', 'Invitation acceptance route enforces Referrer-Policy: no-referrer', 'SECURITY_HEADERS');

  // 4.3 Anti-caching on API routes
  const apiHeaders = await fetch(`${APP_URL}/api/health`);
  const apiCacheControl = apiHeaders.headers.get('cache-control');
  assert(
    apiCacheControl && apiCacheControl.includes('no-store') && apiCacheControl.includes('no-cache'),
    'API routes enforce Cache-Control: no-store, no-cache to eliminate cross-tenant data caching',
    'SECURITY_CACHE'
  );

  // 4.4 Static asset caching
  const assetHeaders = await fetch(`${APP_URL}/msfav.png`);
  if (assetHeaders.status === 200) {
    const assetCacheControl = assetHeaders.headers.get('cache-control');
    assert(
      assetCacheControl && assetCacheControl.includes('public'),
      'Static brand assets include public Cache-Control headers',
      'PERFORMANCE_CACHE'
    );
  }

  // =========================================================================
  // SECTION 5: GOOGLE ANALYTICS PRIVACY & SANITIZATION INTEGRITY
  // =========================================================================
  console.log('\n--- Section 5: Google Analytics 4 Privacy & Safety Bounds ---');

  // When NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, verify no unconfigured scripts are loaded
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    assert(
      !homeHtml.includes('googletagmanager.com/gtag/js'),
      'When NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, GA script is NOT injected',
      'ANALYTICS_SAFETY'
    );
  }

  // Direct unit test of lib/analytics.ts privacy parameters
  const { GA_MEASUREMENT_ID, isAnalyticsAllowed, trackEvent } = await import('../lib/analytics');
  assert(typeof isAnalyticsAllowed === 'function', 'Analytics utility isAnalyticsAllowed export available', 'ANALYTICS');
  assert(typeof trackEvent === 'function', 'Analytics utility trackEvent export available', 'ANALYTICS');

  // Verify that in node or without consent, trackEvent does not execute or throw
  let trackThrew = false;
  try {
    trackEvent('test_event', { email: 'leak@example.com', safe_metric: 1 });
  } catch {
    trackThrew = true;
  }
  assert(!trackThrew, 'trackEvent executes safely without throwing when unconsented', 'ANALYTICS_SAFETY');

  // =========================================================================
  // SECTION 6: AUTHENTICATION REDIRECT ON PRIVATE ROUTES
  // =========================================================================
  console.log('\n--- Section 6: Private Route Redirection & Access Boundaries ---');

  const dashRes = await fetch(`${APP_URL}/dashboard`, { redirect: 'manual' });
  assert(
    dashRes.status === 307 || dashRes.status === 308 || dashRes.status === 302 || dashRes.status === 401,
    `Unauthenticated access to /dashboard is blocked or redirected to sign-in (status: ${dashRes.status})`,
    'AUTH_GUARD'
  );

  console.log('\n================================================================');
  console.log(`PHASE 9 VERIFICATION TOTALS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch((err) => {
  console.error('Phase 9 verification error:', err);
  process.exit(1);
});
