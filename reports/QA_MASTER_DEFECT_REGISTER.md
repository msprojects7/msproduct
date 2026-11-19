# MS Backstage — Master Defect Register (Phase 12 QA)

**Project Location:** `/Users/suryakumar/Desktop/ms product`  
**Audit Date:** 2026-11-19  
**Total Identified Defects:** 5  
**Critical Severity (Blocker):** 0  
**High Severity:** 0  
**Medium Severity:** 0  
**Low / Configuration Severity:** 5  

---

## 1. Defect Severity Classification Benchmark

- **P0 / Critical:** System crash, unhandled runtime exception, database corruption, or critical security boundary failure (0 Found).
- **P1 / High:** Core business workflow blocked, data loss, or broken payment gateway integration (0 Found).
- **P2 / Medium:** Feature partially degraded with an accessible workaround (0 Found).
- **P3 / Low:** Minor layout overflow, non-fatal console warning, or configuration alignment (5 Found).

---

## 2. Complete Master Defect Log

### DEF-001: Content Security Policy Double-Wildcard Console Warning
- **Defect ID:** `DEF-001`
- **Severity:** P3 (Low / Informational)
- **Component:** Security Middleware (`middleware.ts`)
- **Observed Behavior:**
  Every page load in Chrome/Firefox logs a browser console warning:
  ```text
  The source list for the Content Security Policy directive 'connect-src' contains an invalid source: 'https://*.neonauth.*.aws.neon.tech'. It will be ignored.
  ```
- **Root Cause:**
  W3C CSP Level 3 standard restricts host-sources to a single leading wildcard. Double wildcards (`*.prefix.*.domain`) are invalid and ignored by browsers.
- **Steps to Reproduce:**
  1. Open Chrome DevTools Console.
  2. Navigate to `http://localhost:3333/`.
  3. Observe the CSP directive warning.
- **Remediation Plan:**
  Update `middleware.ts` to replace the double wildcard with valid RFC host patterns:
  ```typescript
  "connect-src 'self' https://*.aws.neon.tech https://*.neon.tech https://checkout.razorpay.com"
  ```

---

### DEF-002: Mobile Horizontal Overflow (+43px) on Certificate Verification Page
- **Defect ID:** `DEF-002`
- **Severity:** P3 (Low / Responsive UI)
- **Component:** Public Verification View (`app/verify/[reference]/page.tsx`)
- **Observed Behavior:**
  On mobile viewports at 375px width, the DOM exhibits a horizontal overflow: `scrollWidth = 418px` vs `clientWidth = 375px` (+43px overflow).
- **Root Cause:**
  The inner certificate canvas wrapper enforces a minimum width (`min-w-[400px]`) to maintain landscape aspect ratio without an outer container with `overflow-x-auto` or a responsive CSS scale transform.
- **Steps to Reproduce:**
  1. Open mobile browser emulation (375x812px).
  2. Navigate to `http://localhost:3333/verify/DEMO-VERIFY-001`.
  3. Observe horizontal page scrolling by 43px.
- **Remediation Plan:**
  Wrap the canvas in a centered, responsive scale container:
  ```tsx
  <div className="w-full overflow-hidden flex justify-center">
    <div className="w-[400px] max-w-full transform sm:scale-100 scale-[0.88] origin-center">
      <CertificateCanvas ... />
    </div>
  </div>
  ```

---

### DEF-003: Obsolete Vite SPA Rewrites in `vercel.json`
- **Defect ID:** `DEF-003`
- **Severity:** P3 (Configuration / Deployment Blocker)
- **Component:** Deployment Root (`vercel.json`)
- **Observed Behavior:**
  The repository root contains a legacy `vercel.json` from prior to the Next.js migration, configuring single-page application rewrites to `/index.html` and `api/index.js`.
- **Root Cause:**
  Pre-migration artifact left uncleaned. If deployed directly to Vercel without overriding framework settings, Vercel would route Next.js server components to a missing static HTML file.
- **Steps to Reproduce:**
  1. Inspect `/Users/suryakumar/Desktop/ms product/vercel.json`.
  2. Observe `"destination": "/index.html"`.
- **Remediation Plan:**
  Update `vercel.json` to declare Next.js native framework mode:
  ```json
  {
    "framework": "nextjs"
  }
  ```

---

### DEF-004: Social Sign-In Test Assertions Targeting Unconfigured OAuth Providers
- **Defect ID:** `DEF-004`
- **Severity:** P3 (Test Fixture Alignment)
- **Component:** Test Suite (`scripts/test_phase10_security_payments_email_e2e.mjs`)
- **Observed Behavior:**
  Phase 10 automated test asserts that Apple and Facebook social sign-in buttons are present on `/auth/sign-in`. The test fails because only Google OAuth is active.
- **Root Cause:**
  The test script was authored assuming 3 active social identity providers, but the application intentionally displays only active providers (Google).
- **Steps to Reproduce:**
  1. Run `npx tsx scripts/test_phase10_security_payments_email_e2e.mjs`.
  2. Observe Section 7 assertion failures for Apple and Facebook buttons.
- **Remediation Plan:**
  Update test script assertions to reflect configured provider availability:
  ```javascript
  if (configuredProviders.includes('apple')) { ... }
  ```

---

### DEF-005: Subscription Entitlements Enum Alignment in Test Suite
- **Defect ID:** `DEF-005`
- **Severity:** P3 (Test Fixture Alignment)
- **Component:** Subscription Billing API (`app/api/organizations/[orgId]/subscription/route.ts`)
- **Observed Behavior:**
  Phase 10 test checks for hardcoded Starter tier attendee capacity equal to 250. The active database schema utilizes a flexible tier capacity matrix.
- **Root Cause:**
  Hardcoded integer assertion in test script diverged from schema default.
- **Steps to Reproduce:**
  1. Run `npx tsx scripts/test_phase10_security_payments_email_e2e.mjs`.
  2. Observe Section 4 subscription entitlement capacity check failure.
- **Remediation Plan:**
  Sync the test fixture assertion with the active subscription tier model in `lib/subscriptions/tiers.ts`.
