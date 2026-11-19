# MS Backstage — Complete Frontend Route Inventory (Phase 1 QA)

**Project Location:** `/Users/suryakumar/Desktop/ms product`  
**Audit Timestamp:** 2026-11-19T15:10:00+05:30  
**Audit Scope:** 100% of Next.js 14 App Router frontend pages, layouts, and public client/server routes.  
**Ground-Truth Count:** **49 Frontend Pages**, **9 Layouts**, **46 Database Tables** (Updated from previous outdated 47-page count).

---

## 1. Executive Summary & Verification Methodology

Every route listed below was verified directly from the project source tree (`app/**/page.tsx` and `app/**/layout.tsx`). Rendering strategies (React Server Component vs. Client Component), authentication guards, and role-based access restrictions have been audited against the actual source implementations and server-side RBAC contexts (`requirePlatformAdminContext`, `requireOrgContext`, `requireEventStaffContext`, `requireAttendeeContext`).

### Core Summary Metrics:
- **Total Frontend Pages (`page.tsx`):** 49
- **Total Shared Layouts (`layout.tsx`):** 9
- **Public / Marketing Routes:** 3 (`/`, `/features`, `/pricing`)
- **Public Auth Routes:** 5 (`/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/sign-out`)
- **Public Event & Attendee Routes:** 6 (`/p/[slug]`, `/p/[slug]/[pageSlug]`, `/p/[slug]/register`, `/p/[slug]/confirmation/[orderReference]`, `/p/[slug]/attendee`, `/verify/[reference]`)
- **Invitation Acceptance Route:** 1 (`/invitations/accept`)
- **Platform & Organization Workspace Routes:** 8 (`/dashboard`, `/organizations`, `/organizations/new`, `/organizations/[orgSlug]`, `/organizations/[orgSlug]/settings`, `/organizations/[orgSlug]/members`, `/organizations/[orgSlug]/invitations`, `/organizations/[orgSlug]/events/new`)
- **Event Management & Operational Routes:** 26 (Dashboard, Settings, Staff, Audit, Speakers, Agenda, Sponsors, Tickets, Promo Codes, Registration Forms, Registrations, Website Studio, Check-in, Kiosk, Badge Printing, Badges, Badge Designer, Certificates Studio, Attendance Analytics, Attendees Directory, Spot Registration, Scanner, Reports, Import, Zones)

---

## 2. Layouts Hierarchy & Centralized Navigation (9 Layouts)

| # | Layout File Path | Scope | Rendering Type | Navigations & Providers Contained |
|---|---|---|---|---|
| 1 | `app/layout.tsx` | Root Application | Server Component | Centralized `<AppleDock />`, Theme Provider, Meta tags, Inter font |
| 2 | `app/auth/layout.tsx` | Authentication Flow | Client Component | Guest auth container, Branding headers |
| 3 | `app/auth/reset-password/layout.tsx` | Password Recovery | Client Component | Token validation wrapper |
| 4 | `app/dashboard/layout.tsx` | Global Dashboard | Client Component | Workspace header, Breadcrumb bar, Org switcher |
| 5 | `app/organizations/layout.tsx` | Org Directory | Client Component | Organization list container |
| 6 | `app/organizations/[orgSlug]/layout.tsx` | Single Organization | Client Component | Org navigation sub-bar (Overview, Events, Members, Invitations, Settings) |
| 7 | `app/events/layout.tsx` | Events Directory | Client Component | Event workspace container |
| 8 | `app/events/[eventSlug]/layout.tsx` | Single Event Console | Client Component | Event horizontal sub-bar (Console, Attendees, Spot Reg, Scanner, Badges, Designer, Reports) |
| 9 | `app/invitations/layout.tsx` | Invitation Flow | Client Component | Invitation action wrapper |

> **Navigation Architectural Rule Verified:** Child pages (`app/events/[eventSlug]/certificates/page.tsx`, etc.) do **not** re-import or render duplicate `<AppleDock />` components. The single parent `app/layout.tsx` renders the unified dock.

---

## 3. Comprehensive Frontend Page Route Directory (49 Pages)

| # | Route URL Path | Source File | Component Type | Auth Guard / RBAC Requirement | Verified HTTP Status |
|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Server Component | Public | 200 OK |
| 2 | `/features` | `app/features/page.tsx` | Server Component | Public | 200 OK |
| 3 | `/pricing` | `app/pricing/page.tsx` | Server Component | Public | 200 OK |
| 4 | `/auth/sign-in` | `app/auth/sign-in/page.tsx` | Client Component | Public (Guest only) | 200 OK |
| 5 | `/auth/sign-up` | `app/auth/sign-up/page.tsx` | Client Component | Public (Guest only) | 200 OK |
| 6 | `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Client Component | Public (Guest only) | 200 OK |
| 7 | `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Client Component | Public (Token required) | 200 OK |
| 8 | `/auth/sign-out` | `app/auth/sign-out/page.tsx` | Client Component | Authenticated Session | 200 OK |
| 9 | `/invitations/accept` | `app/invitations/accept/page.tsx` | Client Component | Authenticated Session | 200 OK |
| 10 | `/dashboard` | `app/dashboard/page.tsx` | Server Component | Authenticated Session | 200 OK |
| 11 | `/organizations` | `app/organizations/page.tsx` | Server Component | Authenticated Session | 200 OK |
| 12 | `/organizations/new` | `app/organizations/new/page.tsx` | Client Component | Authenticated Session | 200 OK |
| 13 | `/organizations/[orgSlug]` | `app/organizations/[orgSlug]/page.tsx` | Server Component | Org Member+ (`org:view`) | 200 OK |
| 14 | `/organizations/[orgSlug]/settings` | `app/organizations/[orgSlug]/settings/page.tsx` | Client Component | Org Admin+ (`org:update`) | 200 OK |
| 15 | `/organizations/[orgSlug]/members` | `app/organizations/[orgSlug]/members/page.tsx` | Client Component | Org Admin+ (`org:manage_members`) | 200 OK |
| 16 | `/organizations/[orgSlug]/invitations` | `app/organizations/[orgSlug]/invitations/page.tsx` | Client Component | Org Admin+ (`org:manage_members`) | 200 OK |
| 17 | `/organizations/[orgSlug]/events/new` | `app/organizations/[orgSlug]/events/new/page.tsx` | Client Component | Org Admin+ (`org:create_event`) | 200 OK |
| 18 | `/events/[eventSlug]` | `app/events/[eventSlug]/page.tsx` | Server Component | Event Staff+ (`event:view`) | 200 OK |
| 19 | `/events/[eventSlug]/settings` | `app/events/[eventSlug]/settings/page.tsx` | Client Component | Event Manager+ (`event:update_settings`) | 200 OK |
| 20 | `/events/[eventSlug]/staff` | `app/events/[eventSlug]/staff/page.tsx` | Client Component | Event Manager+ (`event:manage_staff`) | 200 OK |
| 21 | `/events/[eventSlug]/staff/new` | `app/events/[eventSlug]/staff/new/page.tsx` | Client Component | Event Manager+ (`event:manage_staff`) | 200 OK |
| 22 | `/events/[eventSlug]/audit` | `app/events/[eventSlug]/audit/page.tsx` | Client Component | Event Manager+ (`event:view_scans`) | 200 OK |
| 23 | `/events/[eventSlug]/speakers` | `app/events/[eventSlug]/speakers/page.tsx` | Client Component | Content Manager+ (`event:manage_content`) | 200 OK |
| 24 | `/events/[eventSlug]/agenda` | `app/events/[eventSlug]/agenda/page.tsx` | Client Component | Content Manager+ (`event:manage_content`) | 200 OK |
| 25 | `/events/[eventSlug]/sponsors` | `app/events/[eventSlug]/sponsors/page.tsx` | Client Component | Content Manager+ (`event:manage_content`) | 200 OK |
| 26 | `/events/[eventSlug]/tickets` | `app/events/[eventSlug]/tickets/page.tsx` | Client Component | Event Manager+ (`event:manage_content`) | 200 OK |
| 27 | `/events/[eventSlug]/promo-codes` | `app/events/[eventSlug]/promo-codes/page.tsx` | Client Component | Event Manager+ (`event:manage_content`) | 200 OK |
| 28 | `/events/[eventSlug]/registration-forms` | `app/events/[eventSlug]/registration-forms/page.tsx` | Client Component | Event Manager+ (`event:manage_content`) | 200 OK |
| 29 | `/events/[eventSlug]/registrations` | `app/events/[eventSlug]/registrations/page.tsx` | Client Component | Desk Staff+ (`event:view_registrations`) | 200 OK |
| 30 | `/events/[eventSlug]/website` | `app/events/[eventSlug]/website/page.tsx` | Client Component | Event Manager+ (`event:manage_content`) | 200 OK |
| 31 | `/events/[eventSlug]/check-in` | `app/events/[eventSlug]/check-in/page.tsx` | Client Component | Desk Staff+ (`event:manage_checkin`) | 200 OK |
| 32 | `/events/[eventSlug]/kiosk` | `app/events/[eventSlug]/kiosk/page.tsx` | Client Component | Desk Staff+ (`event:manage_kiosk`) | 200 OK |
| 33 | `/events/[eventSlug]/badge-printing` | `app/events/[eventSlug]/badge-printing/page.tsx` | Client Component | Desk Staff+ (`event:manage_badge_printing`) | 200 OK |
| 34 | `/events/[eventSlug]/certificates` | `app/events/[eventSlug]/certificates/page.tsx` | Client Component | Event Manager+ (`event:manage_certificates`) | 200 OK |
| 35 | `/events/[eventSlug]/analytics/attendance` | `app/events/[eventSlug]/analytics/attendance/page.tsx` | Client Component | Event Manager+ (`event:view_attendance_analytics`) | 200 OK |
| 36 | `/events/[eventSlug]/attendees` | `app/events/[eventSlug]/attendees/page.tsx` | Client Component | Desk Staff+ (`event:view_attendee_pii`) | 200 OK |
| 37 | `/events/[eventSlug]/spot-registration` | `app/events/[eventSlug]/spot-registration/page.tsx` | Client Component | Desk Staff+ (`event:create_attendee`) | 200 OK |
| 38 | `/events/[eventSlug]/scanner` | `app/events/[eventSlug]/scanner/page.tsx` | Client Component | Scanner Operator+ (`event:scan_badge`) | 200 OK |
| 39 | `/events/[eventSlug]/badges` | `app/events/[eventSlug]/badges/page.tsx` | Client Component | Desk Staff+ (`event:print_badge`) | 200 OK |
| 40 | `/events/[eventSlug]/badges/designer` | `app/events/[eventSlug]/badges/designer/page.tsx` | Client Component | Event Manager+ (`event:manage_badge_printing`) | 200 OK |
| 41 | `/events/[eventSlug]/reports` | `app/events/[eventSlug]/reports/page.tsx` | Client Component | Event Manager+ (`event:view_attendance_analytics`) | 200 OK |
| 42 | `/events/[eventSlug]/import` | `app/events/[eventSlug]/import/page.tsx` | Client Component | Event Manager+ (`event:import_attendees`) | 200 OK |
| 43 | `/events/[eventSlug]/zones` | `app/events/[eventSlug]/zones/page.tsx` | Client Component | Event Manager+ (`event:manage_zones`) | 200 OK |
| 44 | `/p/[slug]` | `app/p/[slug]/page.tsx` | Server Component | Public Attendee Microsite | 200 OK |
| 45 | `/p/[slug]/[pageSlug]` | `app/p/[slug]/[pageSlug]/page.tsx` | Server Component | Public Multi-Page Microsite | 200 OK |
| 46 | `/p/[slug]/register` | `app/p/[slug]/register/page.tsx` | Client Component | Public Attendee Registration | 200 OK |
| 47 | `/p/[slug]/confirmation/[orderReference]` | `app/p/[slug]/confirmation/[orderReference]/page.tsx` | Server Component | Public Order Confirmation | 200 OK |
| 48 | `/p/[slug]/attendee` | `app/p/[slug]/attendee/page.tsx` | Client Component | Attendee Magic Token Auth | 200 OK |
| 49 | `/verify/[reference]` | `app/verify/[reference]/page.tsx` | Server Component | Public Certificate Verification | 200 OK |

---

## 4. Key Differences from Previous Reports
1. **Total Page Count:** Recalculated from **47 to 49**.
2. **Newly Discovered Routes in Active Codebase:**
   - `/events/[eventSlug]/zones` (Security & zone access control)
   - `/p/[slug]/[pageSlug]` (Multi-page custom website routing)
   - `/verify/[reference]` (Global cryptographic certificate verification portal)
3. **No Dead or Broken Routes:** All 49 page files compile cleanly under Next.js 14 and render without syntax or import errors.
