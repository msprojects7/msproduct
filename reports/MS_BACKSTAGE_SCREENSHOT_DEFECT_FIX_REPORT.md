# MS Backstage — Screenshot Defect Fix Report

**Date:** November 18, 2026  
**Target Directory:** `/Users/suryakumar/Desktop/ms product`  
**Application Stack:** Next.js 14 App Router, React 18, TypeScript, Neon PostgreSQL, Drizzle ORM, Neon Auth  
**Verification:** 32/32 Website & Certificate Tests Passed, 31/31 Auth & Role Tests Passed, 0 TypeScript Errors

---

## 1. Summary of Applied Fixes

| Defect Area | File(s) Modified | Specific Fix Applied | Verification Status |
| :--- | :--- | :--- | :--- |
| **Organization 403 Crash** | `lib/auth/context.ts`, `app/organizations/[orgSlug]/layout.tsx`, `page.tsx` | Supported Platform Admin resolution via `userId` OR `email`; trapped HTTP 403 gracefully in layout with an Access Restricted screen | **PASSED** |
| **Public Hero Preview Text & Badges** | `app/p/[slug]/page.tsx`, `app/globals.css` | Scoped `.light h1` and `.text-slate-100` to preserve pure white on dark banners; styled Date & Venue badges with explicit dark background and white text | **PASSED** |
| **Subpage Dark Banner Contrast** | `app/p/[slug]/[pageSlug]/page.tsx` | Added `.hero-dark-banner` and explicit style attributes for `#ffffff` heading and `#cbd5e1` description | **PASSED** |
| **Signatory Overlap & Clamping** | `CertificateCanvas.tsx`, `CanvaCertificateDesigner.tsx` | Redesigned signatory component to separate simulated script signature, dividing line, printed name, and title with line-clamping | **PASSED** |
| **Certificate Studio KPI Stats** | `app/events/[eventSlug]/certificates/page.tsx` | Changed `Active Templates` stat card to `bg-white dark:bg-slate-900/80` and `text-slate-900 dark:text-white` | **PASSED** |
| **Onsite Check-In KPI Stats** | `app/events/[eventSlug]/check-in/page.tsx` | Changed `Total Confirmed` stat card from static `text-white` to `text-slate-900 dark:text-white` | **PASSED** |
| **Badge Printing Contrast & Values** | `app/events/[eventSlug]/badge-printing/page.tsx` | Updated notification alert to rich emerald classes; wrapped `Print Status:` and `Attendance:` values in high-contrast pill badges | **PASSED** |
| **Zone Access Dropdown & Seed** | `app/events/[eventSlug]/zones/page.tsx` | Added fallback `<option>` when 0 zones exist; added 1-click action to seed Main Auditorium, VIP Lounge, and Speaker Lounge | **PASSED** |

---

## 2. Code Changes Detail

### 2.1. Centralized Platform Admin Matching (`lib/auth/context.ts`)
```typescript
const [platformAdmin] = await db
  .select()
  .from(platformAdministrators)
  .where(
    user.email
      ? or(
          eq(platformAdministrators.userId, user.id),
          eq(platformAdministrators.email, user.email)
        )
      : eq(platformAdministrators.userId, user.id)
  )
  .limit(1);
```
Applied across:
- `requireOrgContext`
- `requireEventContext`
- `requirePlatformAdminContext`
- `assumeTenantSupportContext`
- `app/organizations/page.tsx`
- `app/dashboard/page.tsx`

### 2.2. Global CSS Scoping for Dark Banners in Light Mode (`app/globals.css`)
```css
/* Light mode headings - ONLY on light backgrounds, NEVER on dark banners */
.light h1:not(.preserve-color):not(.preserve-white):not([class*="from-slate-900"] *):not([class*="from-slate-950"] *):not(.hero-dark-banner *):not(.preserve-dark *),
.light h2:not(.preserve-color):not(.preserve-white):not([class*="from-slate-900"] *):not([class*="from-slate-950"] *):not(.hero-dark-banner *):not(.preserve-dark *),
.light h3:not(.preserve-color):not(.preserve-white):not([class*="from-slate-900"] *):not([class*="from-slate-950"] *):not(.hero-dark-banner *):not(.preserve-dark *),
.light h4:not(.preserve-color):not(.preserve-white):not([class*="from-slate-900"] *):not([class*="from-slate-950"] *):not(.hero-dark-banner *):not(.preserve-dark *) {
  color: #0f172a !important;
}

/* Explicit rule for dark banners in light mode to keep text bright white & legible */
.light [class*="from-slate-900"] h1,
.light [class*="from-slate-950"] h1,
.light .hero-dark-banner h1,
.light .preserve-dark h1 {
  color: #ffffff !important;
}

/* Date and venue badges inside dark banners: maintain dark pill with white text */
.light .preserve-dark-badge,
.light [class*="from-slate-900"] .bg-slate-900\/90,
.light [class*="from-slate-950"] .bg-slate-900\/90,
.light .hero-dark-banner .bg-slate-900\/90 {
  background-color: rgba(15, 23, 42, 0.95) !important;
  color: #ffffff !important;
  border-color: rgba(51, 65, 85, 0.8) !important;
}
```

### 2.3. Certificate Signatory Architecture (`CertificateCanvas.tsx` & `CanvaCertificateDesigner.tsx`)
Separated signature presentation from printed name metadata:
```tsx
<div className="text-left space-y-1 max-w-[200px]">
  {signatureUrl ? (
    <img src={signatureUrl} alt="Signature" className="h-7 w-auto object-contain mb-1" />
  ) : (
    <div className="h-6 flex items-end">
      <span
        className="text-xs sm:text-sm font-serif italic tracking-wider select-none opacity-90 block truncate"
        style={{ color: theme.accentColor, fontFamily: 'Georgia, "Brush Script MT", cursive, serif' }}
      >
        {signatoryName}
      </span>
    </div>
  )}
  <div className="w-32 sm:w-40 h-[1px] my-1" style={{ backgroundColor: theme.textColor, opacity: 0.35 }} />
  <div className="space-y-0.5">
    <p className="text-[10px] sm:text-[11px] font-bold leading-tight uppercase tracking-wider" style={{ color: theme.titleColor }}>
      {signatoryName}
    </p>
    <p className="text-[8px] sm:text-[9px] opacity-75 leading-tight line-clamp-1" style={{ color: theme.textColor }}>
      {signatoryTitle}
    </p>
  </div>
</div>
```

### 2.4. Zone Seeding Implementation (`app/events/[eventSlug]/zones/page.tsx`)
```tsx
const handleSeedDefaultZones = async () => {
  try {
    setSavingZone(true);
    const defaults = [
      { name: 'Main Auditorium', location: 'Hall A, Ground Floor', capacity: 500, allowedTicketTypes: ['Delegate', 'VIP', 'Speaker'] },
      { name: 'VIP Networking Lounge', location: 'Mezzanine Level', capacity: 50, allowedTicketTypes: ['VIP'] },
      { name: 'Speaker & Faculty Lounge', location: 'Behind Main Stage', capacity: 25, allowedTicketTypes: ['Speaker'] },
    ];

    for (const zone of defaults) {
      await fetch(`/api/events/${eventSlug}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone),
      });
    }
    fetchZones();
  } catch (err: unknown) {
    const e = err as Error;
    alert(`Error initializing default zones: ${e.message}`);
  } finally {
    setSavingZone(false);
  }
};
```
