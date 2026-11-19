# MS Backstage — Comprehensive UI/UX Design & Layout Audit Report

**Project:** MS Backstage  
**Date:** November 18, 2026  
**Auditor:** Design Systems & Frontend UX Engineering Group

---

## 1. Executive Summary

This audit evaluates the visual hierarchy, layout consistency, typography, responsive behavior, card alignment, navigation clarity, and floating widget placement across MS Backstage. The audit specifically inspects the issues captured in user testing screenshots and verifies the permanent design corrections implemented.

---

## 2. Screenshot Defect Analysis & Implemented Solutions

### Issue 1: Organizations Page Card Alignment & Typography (Screenshot 1)
- **User Finding:** The cards displayed on `/organizations` had disproportionately small font sizes (`text-[10px]` and `text-xs`), faint borders, awkward horizontal spacing, and uneven card heights. The Customer Support floating button overlapped the bottom right card.
- **Root Cause:** Absence of minimum height constraints on cards (`min-h-[230px]`), raw un-truncated title labels causing text squeezing, and inflexible fixed positioning of the floating support button (`bottom-6 right-6`).
- **Implemented Fix:**
  - Standardized card grid to `min-h-[230px]` with flexbox space-between distribution so action buttons in a row align on the exact same baseline.
  - Added `min-w-0 flex-1 truncate` to title and slug containers with hover tooltips (`title={org.name}`).
  - Upgraded action buttons ("Open Workspace", "Settings") with comfortable touch targets and clear hover background states.
  - Refined status badges with clear contrast colors (`emerald-500` / `red-500`).

### Issue 2: React Server Component Function Serialization Crash (Screenshot 2)
- **User Finding:** Navigating to `/organizations/[orgSlug]` crashed with the error boundary: *"Something went wrong. Incident Reference: ref_mwltbexm_zlu6"*.
- **Root Cause:** Next.js App Router forbids passing React Component functions or objects containing functions (such as Lucide React `Calendar` or `Building2`) across the Server Component -> Client Component boundary. In `EmptyState.tsx`, `'use client'` was declared on line 1 while receiving `icon={Calendar}` from the server component `app/organizations/[orgSlug]/page.tsx`.
- **Implemented Fix:** Removed `'use client'` directive from `app/components/ui/EmptyState.tsx`. The component now behaves as an isomorphic React component (rendering directly on the server when imported by server components, and on the client when imported by client components).

### Issue 3: Missing Relations / Database Schema Desync (Screenshots 3, 4, and 5)
- **User Finding:**
  - `/events/summit-26/tickets`: Red error banner: *"An unexpected error occurred while processing your request."*
  - `/events/summit-26/kiosk`: Browser alert popup: *"localhost:3333 says An unexpected error occurred while processing your request."*
  - `/events/summit-26/agenda`: Red error banner: *"Internal Server Error"*.
- **Root Cause:** Drizzle migration journal had an unrecorded entry for migration `0005`, preventing subsequent migrations `0006` (Stage 1), `0007` (Stage 2), `0008` (Stage 3), and `0009` (Stage 4) from executing against the active PostgreSQL database. Tables `event_tickets`, `kiosk_sessions`, `event_sessions`, `event_tracks`, and `event_speakers` did not exist in the database.
- **Implemented Fix:** Synchronized the migration journal in `drizzle.__drizzle_migrations` and executed `node scripts/migrate.mjs`, creating all required tables in Neon PostgreSQL.

### Issue 4: Aggressive Multi-Tab Lockout Script & Customer Support Pill Overlap
- **User Finding:** The blue Customer Support widget was floating over cards and action buttons. Users opening a second browser tab were blocked by an aggressive full-screen lockout banner (*"Session Active in Another Tab"*).
- **Root Cause:** `CustomerServiceFloatingWidget.tsx` contained an aggressive `BroadcastChannel` script that retired tabs on matching pathnames. Additionally, the widget was hardcoded as a wide fixed pill at `bottom-6 right-6 z-40`.
- **Implemented Fix:**
  - Removed the `BroadcastChannel` lockout script, allowing organizers and attendees to seamlessly open multiple tabs (e.g., tickets, agenda, public website) without disruption.
  - Redesigned the customer support widget into an unobtrusive, compact FAB (Floating Action Button) with a clean backdrop-blur pill, subtle call icon, and a one-click dismiss button (`X`).

### Issue 5: Navigation Dock "More" Dropdown Overflow (Screenshots 3, 4, 5)
- **User Finding:** In the top `AppleDock` navigation bar, clicking "More v" rendered a 17-item vertical menu in a narrow `w-48` box with no height constraints, causing items to overflow below the viewport on smaller screens.
- **Root Cause:** Lack of categorization and missing `max-h-[calc(100vh-100px)] overflow-y-auto` styling.
- **Implemented Fix:** Redesigned the dropdown in `AppleDock.tsx` into a structured, categorized popover (`w-72 sm:w-80`) with 5 clear sections:
  1. **Content & Schedule** (Agenda & Tracks, Speakers & Faculty, Sponsors & Booths)
  2. **Ticketing & Registration** (Website Builder, Tickets & Pricing, Promo Codes, Registration Forms, Orders & Sales)
  3. **Onsite Desk & Badging** (Check-In Operations, Self Kiosk Mode, Badge Printing Ops)
  4. **Intelligence & Certificates** (Attendance & Footfall, Certificates Studio, Import Attendees)
  5. **Settings & Security** (Staff Management, Security Audit Log, Event Settings)
  Plus a prominent Sign Out action with clean separation.

### Issue 6: Browser Alert Popups Replaced with Non-Blocking Toasts
- **User Finding:** Clicking actions or encountering errors triggered raw browser modals (`localhost:3333 says...`).
- **Root Cause:** Legacy calls to `window.alert(...)` throughout event desk pages.
- **Implemented Fix:** Replaced all 17 occurrences of `alert(...)` across `kiosk`, `tickets`, `agenda`, `speakers`, `sponsors`, `promo-codes`, `registration-forms`, and `registrations` with elegant, non-blocking `toast.error(...)` and `toast.success(...)` notifications.

---

## 3. Visual & Responsive Design Guidelines Standardized

1. **Card Elevation & Contrast:** Cards across organizations and event modules now use `glass-panel` styling with distinct light/dark borders (`border-slate-200/80 dark:border-slate-800/80`).
2. **Typography Scale:** Established minimum readable sizes (`text-xs` for secondary metadata, `text-sm` for table contents, `text-base` for card titles, `text-xl` to `text-2xl` for page headers).
3. **Touch Targets:** Interactive buttons adhere to WCAG 2.1 AA requirements (minimum 44x44px touch boundaries).
