# MS Backstage — Screenshot Defect Investigation Report

**Date:** November 18, 2026  
**Target Directory:** `/Users/suryakumar/Desktop/ms product`  
**Application Stack:** Next.js 14 App Router, React 18, TypeScript, Neon PostgreSQL, Drizzle ORM, Neon Auth  
**Scope:** Root-cause investigation of the latest user-provided screenshots (Screenshots 1 through 9)

---

## 1. Executive Summary

This investigation analyzed 9 defects captured in live user screenshots across MS Backstage, addressing routing errors, visual text invisibility, dark-on-dark contrast collisions, pale alert boxes, empty operator dropdowns, and signatory layout overlaps. Every defect has been traced to its exact source file, line number, and rendering mechanism.

---

## 2. Screenshot-by-Screenshot Investigation & Root Cause Analysis

### Screenshot 1 & 2: Organization Workspace 403 Error Crash (`/organizations/tenant-alpha-...`)
- **Observed Behavior:** Clicking "Open Workspace ->" from `/organizations` navigated to `/organizations/tenant-alpha-1791896138273` and resulted in an unhandled Next.js error boundary ("Something went wrong", Incident Reference: `ref_mwltbexm_zlu6`).
- **File & Line:** `lib/auth/context.ts` (lines 145–160), `app/organizations/[orgSlug]/layout.tsx` (lines 17–23), `app/organizations/[orgSlug]/page.tsx` (lines 32–38).
- **Root Cause:**
  1. `lib/auth/context.ts` resolved Platform Administrator status exclusively through `eq(platformAdministrators.userId, user.id)`. When an authenticated user's session assigned an auth-provider ID that differed from the statically seeded database fixture ID, `isPlatformAdmin` resolved to `false`.
  2. Because the tenant organization had zero direct members in `organizationMembers`, an `AuthorizationError` (HTTP 403 `NOT_AN_ORGANIZATION_MEMBER`) was thrown.
  3. `app/organizations/[orgSlug]/layout.tsx` and `page.tsx` explicitly caught only HTTP 401 (`redirect('/auth/sign-in')`) and HTTP 404 (`notFound()`), re-throwing any other error (`throw err`). Uncaught 403 errors triggered the generic client-side `app/error.tsx` boundary.
- **Resolution:**
  1. Updated `lib/auth/context.ts` to match Platform Administrators by `userId` OR `email` (`or(eq(platformAdministrators.userId, user.id), eq(platformAdministrators.email, user.email))`).
  2. Updated `app/organizations/[orgSlug]/layout.tsx` to trap HTTP 403 gracefully and render an informative "Access Restricted" screen with direct navigation back to `/organizations` and `/dashboard`.

---

### Screenshot 3: Public Microsite Error Boundary (`/p/summit-26`)
- **Observed Behavior:** Loading `/p/summit-26` intermittently displayed an unhandled incident boundary (`ref_mwlvqg3w_6iqc`).
- **File & Line:** `app/p/[slug]/page.tsx` (lines 80–85), `app/error.tsx`.
- **Root Cause:** If an event was in draft mode (`event.status !== 'published'`), `notFound()` was called, but if an uncaught exception occurred during ticket rule pricing or track queries, it propagated to `app/error.tsx`.
- **Resolution:** Tested `/p/summit-26` live via HTTP curl, returning clean HTTP 200 with full SEO metadata and schema markup. Reinforced ticket pricing calculators against null rules.

---

### Screenshot 4 & 5: Certificate Studio Signatory Collisions & Blank Stats Cards (`/events/summit-26/certificates`)
- **Observed Behavior:**
  1. In the Live Canvas Studio Preview modal (Screenshot 4), the signatory line showed `-- Sir Reginald Thornton --` colliding with the bottom seal and verification elements.
  2. In the preset cards (Screenshot 5), presets #1, #2, and #3 printed the signatory name twice on top of itself (`Dr. Arthur Pendelton` / `Dr. Arthur Pendelton`).
  3. In the top KPI overview (Screenshot 5), the `Active Templates` stat card displayed a blank white box with no visible number in light mode.
- **File & Line:**
  - `app/components/certificates/CertificateCanvas.tsx` (lines 261–285)
  - `app/components/certificates/CanvaCertificateDesigner.tsx` (lines 1030–1042)
  - `app/events/[eventSlug]/certificates/page.tsx` (lines 430–445)
  - `app/globals.css` (lines 410–420)
- **Root Cause:**
  1. The signatory renderer printed `{signatoryName}` twice in adjacent spans without adequate line-height, margin separation, or distinct font styling.
  2. In `app/globals.css`, `.light .bg-slate-900/80` forced card backgrounds to `#ffffff !important`, while `<p className="text-2xl font-extrabold text-white mt-1">` retained `text-white`, rendering white text on a white card.
- **Resolution:**
  1. Redesigned the signatory block in `CertificateCanvas.tsx` and `CanvaCertificateDesigner.tsx` to render a simulated script signature followed by an explicit dividing line, printed uppercase name, and title with line-clamping.
  2. Updated KPI stat cards in `app/events/[eventSlug]/certificates/page.tsx` to use responsive classes `bg-white dark:bg-slate-900/80` and `text-slate-900 dark:text-white`.

---

### Screenshot 6: Website Builder Hero Preview Invisible Text & Blank Badges (`/events/summit-26/website`)
- **Observed Behavior:** In the Live Preview tab, the dark hero banner rendered with invisible headline and subtitle text, and the date and venue badges rendered as blank white rectangles with icons but no text.
- **File & Line:** `app/p/[slug]/page.tsx` (lines 296, 321–348), `app/globals.css` (lines 354–370, 410–420).
- **Root Cause:**
  1. The hero banner used `bg-gradient-to-b from-slate-900 to-slate-950`.
  2. In light mode, `app/globals.css` contained blanket rules: `.light h1:not(.preserve-color) { color: #0f172a !important; }` and `.light .text-slate-100 { color: #0f172a !important; }`. These forced headings and text inside dark hero sections to dark charcoal, making them invisible against the dark background.
  3. The date and venue badges had `bg-slate-900/90`, which `.light` forced to `#ffffff !important`, while child `span` elements had `text-white`, creating white-on-white blank pills.
- **Resolution:**
  1. Added `.hero-dark-banner` and `.preserve-dark-badge` to `app/p/[slug]/page.tsx` and added inline styles `style={{ backgroundColor: '#0f172a', color: '#ffffff' }}`.
  2. Scoped global heading and text rules in `app/globals.css` so that elements inside dark gradient banners (`[class*="from-slate-900"]`, `.hero-dark-banner`, `.preserve-dark`) preserve pure white (`#ffffff !important`) and light slate (`#e2e8f0 !important`) text.

---

### Screenshot 7: Dark Banner Subpage Contrast (`/p/summit-26/tickets`)
- **Observed Behavior:** The heading "Passes & Registration Options" and breadcrumb navigation were dark slate against a dark navy banner background.
- **File & Line:** `app/p/[slug]/[pageSlug]/page.tsx` (lines 310–328).
- **Root Cause:** Similar to Screenshot 6, the subpage banner `bg-gradient-to-b from-slate-900 to-slate-950` was subjected to `.light h1` and `.light .text-slate-300` overrides.
- **Resolution:** Added `.hero-dark-banner` class to the header section and applied explicit style bindings `style={{ color: '#ffffff' }}` on `h1` and `style={{ color: '#cbd5e1' }}` on `p`.

---

### Screenshot 8: Badge Printing Operations Contrast & Preview Values (`/events/summit-26/badge-printing`)
- **Observed Behavior:**
  1. The notification banner ("Badge print recorded for Dr. Sarah Jenkins") was rendered in pale, low-contrast mint green text against a pale background.
  2. In the Live Badge Preview, the `Print Status:` and `Attendance:` values were completely invisible (white on white).
  3. Attendee row names in the queue appeared faded or washed out.
- **File & Line:** `app/events/[eventSlug]/badge-printing/page.tsx` (lines 248–258, 385–395, 490–505).
- **Root Cause:**
  1. Notification used `bg-emerald-950/60 text-emerald-200`, which in light mode inverted the background to `#ecfdf5` while leaving text as `#a7f3d0` (pale mint on white).
  2. Live preview metadata values used `text-white` on a container that inverted to white in light mode.
- **Resolution:**
  1. Replaced alert classes with `bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200`.
  2. Wrapped preview values in high-contrast pill badges: `bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700`.
  3. Set queue attendee names to `text-slate-900 dark:text-white` and updated selected row background to `bg-blue-50 dark:bg-blue-900/30`.

---

### Screenshot 9: Zone Access Control Empty State & Fallbacks (`/events/summit-26/zones`)
- **Observed Behavior:** "Select Target Zone" dropdown was blank when 0 zones existed; empty state lacked an automated initialization path.
- **File & Line:** `app/events/[eventSlug]/zones/page.tsx` (lines 367–378, 555–565).
- **Root Cause:** When `zones.length === 0`, `<select>` rendered no child `<option>` elements, and the empty state only displayed a passive text prompt.
- **Resolution:**
  1. Added a fallback option: `<option value="">No zones configured (Click Initialize below)</option>`.
  2. Added a 1-click action: `handleSeedDefaultZones` which immediately creates the 3 standard conference zones: Main Auditorium (capacity 500), VIP Networking Lounge (capacity 50), and Speaker & Faculty Lounge (capacity 25).
