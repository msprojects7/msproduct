# MS Backstage — Master Defect Register & Resolution Log

**Project:** MS Backstage  
**Date:** November 18, 2026  
**Auditor:** Quality Assurance & Site Reliability Engineering Group

---

## 1. Master Defect Summary

This register catalogs all functional, architectural, database, and UI/UX defects identified during application stabilization, cross-referencing user testing findings, root cause diagnoses, code modifications, and verification proofs.

---

## 2. Defect Register

| Defect ID | Severity | Category | Symptom / Description | Root Cause | File(s) Modified | Resolution Proof | Status |
|---|:---:|:---:|---|---|---|---|:---:|
| **DEF-001** | **CRITICAL** | Database | Database relation missing: `relation "event_tickets" does not exist`, `event_sessions`, `kiosk_sessions` (HTTP 500) | Migration journal desync: migration `0005` was executed out-of-band without being recorded in `drizzle.__drizzle_migrations`, causing subsequent migrations 0006-0009 to abort. | `drizzle.__drizzle_migrations`, `scripts/migrate.mjs` | Applied migrations 0006, 0007, 0008, 0009; all tables created in Neon PostgreSQL. | **CLOSED** |
| **DEF-002** | **CRITICAL** | Frontend RSC | Crash on `/organizations/[orgSlug]`: *"Functions cannot be passed directly to Client Components"* (Screenshot 2) | `EmptyState.tsx` had `'use client'` while receiving raw Lucide React icon components (`Calendar`) from server component `app/organizations/[orgSlug]/page.tsx`. | `app/components/ui/EmptyState.tsx` | Removed `'use client'`; isomorphic component renders on server and client without serialization crash. | **CLOSED** |
| **DEF-003** | **HIGH** | UX / Scripting | Multi-tab lockout: Opening a second tab triggered full-screen blocking overlay *"Session Active in Another Tab"* | Aggressive `BroadcastChannel` script in `CustomerServiceFloatingWidget.tsx` retired any existing tab navigating to the same path. | `app/components/navigation/CustomerServiceFloatingWidget.tsx` | Removed `BroadcastChannel` script; multi-tab browsing now fully enabled. | **CLOSED** |
| **DEF-004** | **HIGH** | UI / Layout | Customer Support widget overlapping cards, buttons, and modal dialogs (Screenshots 1, 3, 4, 5) | Fixed position pill `bottom-6 right-6 z-40` with 160px width covering bottom-right interactive elements. | `app/components/navigation/CustomerServiceFloatingWidget.tsx` | Redesigned into compact, non-intrusive backdrop-blur FAB with one-click dismiss (`X`) button. | **CLOSED** |
| **DEF-005** | **MEDIUM** | UI / Navigation | AppleDock "More v" dropdown menu overflowing below viewport on smaller screens | 17 unstructured links in a narrow `w-48` dropdown container without height constraints or scrollbars. | `app/components/navigation/AppleDock.tsx` | Redesigned into categorized popover (`w-72 sm:w-80 max-h-[calc(100vh-100px)] overflow-y-auto`) with 5 structured sections. | **CLOSED** |
| **DEF-006** | **MEDIUM** | UX / Quality | Raw browser `window.alert(...)` modals displayed on errors and confirmations (Screenshot 4) | Direct `alert(...)` calls in error handlers across 8 event desk pages. | `kiosk/page.tsx`, `tickets/page.tsx`, `agenda/page.tsx`, `speakers/page.tsx`, `sponsors/page.tsx`, `promo-codes/page.tsx`, `registration-forms/page.tsx`, `registrations/page.tsx` | Replaced all 17 `alert(...)` calls with non-blocking, accessible `toast.error()` and `toast.success()` from `useToast`. | **CLOSED** |
| **DEF-007** | **HIGH** | RBAC / Seeding | Registration Staff held `org_admin` permissions instead of `registration_staff` role | Earlier test seed left `staff@apexevents.internal` with `role: 'admin'` in `organization_members`. In addition, `registration_staff` was granted `event:update_settings`. | `lib/auth/permissions.ts`, `scripts/seed_demo_accounts.mjs` | Updated membership to `member`, removed `event:update_settings` from desk staff. 31/31 tests pass. | **CLOSED** |
| **DEF-008** | **LOW** | Code Quality | ESLint regex error in `reports/export/route.ts`: `Unnecessary escape character: \+` | Escaped `\+` inside regex character class `[]`. | `app/api/events/[eventId]/reports/export/route.ts` | Removed escape: `/^[=+\-@\t\r]/`. `npm run lint` passes with 0 errors. | **CLOSED** |
| **DEF-009** | **MEDIUM** | UI / Layout | Small typography and card height mismatch on `/organizations` (Screenshot 1) | Absence of min-height constraints and truncated text wrappers. | `app/organizations/page.tsx` | Added `min-h-[230px]`, `truncate`, clear badge styles, and aligned action footers. | **CLOSED** |

---

## 3. Defect Metrics & Closure Summary

- **Total Logged Defects:** 9
- **Critical Severity:** 2 (Resolved: 2 / 100%)
- **High Severity:** 3 (Resolved: 3 / 100%)
- **Medium Severity:** 3 (Resolved: 3 / 100%)
- **Low Severity:** 1 (Resolved: 1 / 100%)
- **Total Open Defects:** **0** (100% Closure Rate)
