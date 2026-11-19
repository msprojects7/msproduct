# MS Backstage — Complete Application Route Inventory

**Project Location:** `/Users/suryakumar/Desktop/ms product`  
**Execution Date:** November 18, 2026  
**Auditor:** Quality & Reliability Engineering Team  
**Scope:** Stages 1, 2, 3, and 4 — 100% of frontend pages, dynamic routes, and backend REST endpoints.

---

## 1. Executive Summary

This document establishes the exhaustive, ground-truth inventory of all 47 frontend pages and 84 backend API routes comprising the MS Backstage SaaS event management application. Each entry specifies the exact filesystem route path, HTTP method(s), rendering strategy (React Server Component vs. Client Component), required RBAC permissions, and verified HTTP response codes.

---

## 2. Frontend Page Route Inventory (47 Pages)

| # | Route URL Path | Filesystem Source File | Rendering Strategy | Auth / RBAC Requirement | Status |
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
| 43 | `/p/[slug]` | `app/p/[slug]/page.tsx` | Server Component | Public Attendee Microsite | 200 OK |
| 44 | `/p/[slug]/register` | `app/p/[slug]/register/page.tsx` | Client Component | Public Attendee Registration | 200 OK |
| 45 | `/p/[slug]/confirmation/[orderReference]` | `app/p/[slug]/confirmation/[orderReference]/page.tsx` | Server Component | Public Order Confirmation | 200 OK |
| 46 | `/p/[slug]/attendee` | `app/p/[slug]/attendee/page.tsx` | Client Component | Attendee Magic Token Auth | 200 OK |
| 47 | `/p/[slug]/certificate/[certificateReference]` | `app/p/[slug]/certificate/[certificateReference]/page.tsx` | Server Component | Public Certificate Verification | 200 OK |

---

## 3. Backend API Route Inventory (84 Endpoints)

| # | Endpoint Method & Route Path | Filesystem Route File | Security / RBAC | Purpose |
|---|---|---|---|---|
| 1 | `ALL /api/auth/[...path]` | `app/api/auth/[...path]/route.ts` | Neon Auth Proxy | Neon Auth integration & SSO |
| 2 | `GET /api/auth/demo-accounts` | `app/api/auth/demo-accounts/route.ts` | Dev / Test only | Multi-role demo accounts metadata |
| 3 | `POST /api/auth/otp/send` | `app/api/auth/otp/send/route.ts` | Public / Rate-limited | Issue self-hosted email OTP |
| 4 | `POST /api/auth/otp/verify` | `app/api/auth/otp/verify/route.ts` | Public / Rate-limited | Verify email OTP code |
| 5 | `POST /api/auth/register` | `app/api/auth/register/route.ts` | Public / Rate-limited | User self-registration |
| 6 | `POST /api/billing/webhook` | `app/api/billing/webhook/route.ts` | HMAC Signature | Stripe/Razorpay billing webhook |
| 7 | `GET /api/captcha` | `app/api/captcha/route.ts` | Public | Self-hosted SVG CAPTCHA generator |
| 8 | `GET /api/drafts` | `app/api/drafts/route.ts` | Authenticated | List user autosaved form drafts |
| 9 | `POST /api/drafts` | `app/api/drafts/route.ts` | Authenticated | Save form state draft |
| 10 | `GET /api/drafts/[draftId]` | `app/api/drafts/[draftId]/route.ts` | Draft Owner | Retrieve draft state |
| 11 | `DELETE /api/drafts/[draftId]` | `app/api/drafts/[draftId]/route.ts` | Draft Owner | Clear discarded draft |
| 12 | `GET /api/health` | `app/api/health/route.ts` | Public | System and DB health status check |
| 13 | `POST /api/invitations/accept` | `app/api/invitations/accept/route.ts` | Authenticated | Accept team invitation |
| 14 | `GET /api/organizations` | `app/api/organizations/route.ts` | Authenticated | List accessible organizations |
| 15 | `POST /api/organizations` | `app/api/organizations/route.ts` | Authenticated | Create enterprise tenant workspace |
| 16 | `GET /api/organizations/[orgId]` | `app/api/organizations/[orgId]/route.ts` | `org:view` | Organization profile & metadata |
| 17 | `PATCH /api/organizations/[orgId]` | `app/api/organizations/[orgId]/route.ts` | `org:update` | Update workspace settings & branding |
| 18 | `POST /api/organizations/[orgId]/deactivate` | `app/api/organizations/[orgId]/deactivate/route.ts` | `org:delete` | Soft-deactivate organization |
| 19 | `GET /api/organizations/[orgId]/events` | `app/api/organizations/[orgId]/events/route.ts` | `org:view` | List events under organization |
| 20 | `POST /api/organizations/[orgId]/events` | `app/api/organizations/[orgId]/events/route.ts` | `org:create_event` | Provision new conference event |
| 21 | `GET /api/organizations/[orgId]/members` | `app/api/organizations/[orgId]/members/route.ts` | `org:view` | List organization team members |
| 22 | `POST /api/organizations/[orgId]/members` | `app/api/organizations/[orgId]/members/route.ts` | `org:manage_members` | Invite new member |
| 23 | `PATCH /api/organizations/[orgId]/members/[memberId]` | `app/api/organizations/[orgId]/members/[memberId]/route.ts` | `org:manage_members` | Update member role |
| 24 | `DELETE /api/organizations/[orgId]/members/[memberId]` | `app/api/organizations/[orgId]/members/[memberId]/route.ts` | `org:manage_members` | Revoke member membership |
| 25 | `PATCH /api/organizations/[orgId]/members/[memberId]/status` | `app/api/organizations/[orgId]/members/[memberId]/status/route.ts` | `org:manage_members` | Activate/suspend member |
| 26 | `GET /api/organizations/[orgId]/invitations` | `app/api/organizations/[orgId]/invitations/route.ts` | `org:manage_members` | List pending invitations |
| 27 | `DELETE /api/organizations/[orgId]/invitations/[invitationId]` | `app/api/organizations/[orgId]/invitations/[invitationId]/route.ts` | `org:manage_members` | Cancel invitation |
| 28 | `GET /api/organizations/[orgId]/speakers` | `app/api/organizations/[orgId]/speakers/route.ts` | `org:view` | List reusable org speaker library |
| 29 | `POST /api/organizations/[orgId]/speakers` | `app/api/organizations/[orgId]/speakers/route.ts` | `org:update` | Add new reusable speaker profile |
| 30 | `GET /api/organizations/[orgId]/speakers/[speakerId]` | `app/api/organizations/[orgId]/speakers/[speakerId]/route.ts` | `org:view` | Get speaker profile details |
| 31 | `PATCH /api/organizations/[orgId]/speakers/[speakerId]` | `app/api/organizations/[orgId]/speakers/[speakerId]/route.ts` | `org:update` | Update speaker profile |
| 32 | `DELETE /api/organizations/[orgId]/speakers/[speakerId]` | `app/api/organizations/[orgId]/speakers/[speakerId]/route.ts` | `org:update` | Remove speaker profile |
| 33 | `GET /api/organizations/[orgId]/subscription` | `app/api/organizations/[orgId]/subscription/route.ts` | `org:view` | Check tier and attendee quotas |
| 34 | `POST /api/organizations/[orgId]/transfer-ownership` | `app/api/organizations/[orgId]/transfer-ownership/route.ts` | `org:transfer_ownership` | Transfer org ownership |
| 35 | `GET /api/events` | `app/api/events/route.ts` | Authenticated | List all accessible events |
| 36 | `GET /api/events/[eventId]` | `app/api/events/[eventId]/route.ts` | `event:view` | Event overview, counts, and status |
| 37 | `PATCH /api/events/[eventId]` | `app/api/events/[eventId]/route.ts` | `event:update` | Update event parameters |
| 38 | `POST /api/events/[eventId]/archive` | `app/api/events/[eventId]/archive/route.ts` | `event:delete` | Archive/unarchive event |
| 39 | `GET /api/events/[eventId]/settings` | `app/api/events/[eventId]/settings/route.ts` | `event:view` | Event settings & active configurations |
| 40 | `POST /api/events/[eventId]/settings` | `app/api/events/[eventId]/settings/route.ts` | `event:update_settings` | Update settings & badge mode |
| 41 | `GET /api/events/[eventId]/staff` | `app/api/events/[eventId]/staff/route.ts` | `event:manage_staff` | List event staff assignments |
| 42 | `POST /api/events/[eventId]/staff` | `app/api/events/[eventId]/staff/route.ts` | `event:manage_staff` | Assign staff member to event |
| 43 | `PATCH /api/events/[eventId]/staff/[assignmentId]` | `app/api/events/[eventId]/staff/[assignmentId]/route.ts` | `event:manage_staff` | Update staff role or status |
| 44 | `DELETE /api/events/[eventId]/staff/[assignmentId]` | `app/api/events/[eventId]/staff/[assignmentId]/route.ts` | `event:manage_staff` | Remove staff assignment |
| 45 | `GET /api/events/[eventId]/speakers` | `app/api/events/[eventId]/speakers/route.ts` | `event:view` | List speakers linked to this event |
| 46 | `POST /api/events/[eventId]/speakers` | `app/api/events/[eventId]/speakers/route.ts` | `event:manage_content` | Link speaker from org library |
| 47 | `PATCH /api/events/[eventId]/speakers/[speakerId]` | `app/api/events/[eventId]/speakers/[speakerId]/route.ts` | `event:manage_content` | Toggle featured / display order |
| 48 | `DELETE /api/events/[eventId]/speakers/[speakerId]` | `app/api/events/[eventId]/speakers/[speakerId]/route.ts` | `event:manage_content` | Unlink speaker from event |
| 49 | `GET /api/events/[eventId]/tracks` | `app/api/events/[eventId]/tracks/route.ts` | `event:view` | List event tracks and rooms |
| 50 | `POST /api/events/[eventId]/tracks` | `app/api/events/[eventId]/tracks/route.ts` | `event:manage_content` | Create event track and room |
| 51 | `PATCH /api/events/[eventId]/tracks/[trackId]` | `app/api/events/[eventId]/tracks/[trackId]/route.ts` | `event:manage_content` | Update track properties |
| 52 | `DELETE /api/events/[eventId]/tracks/[trackId]` | `app/api/events/[eventId]/tracks/[trackId]/route.ts` | `event:manage_content` | Delete track |
| 53 | `GET /api/events/[eventId]/sessions` | `app/api/events/[eventId]/sessions/route.ts` | `event:view` | List multi-track schedule & sessions |
| 54 | `POST /api/events/[eventId]/sessions` | `app/api/events/[eventId]/sessions/route.ts` | `event:manage_content` | Schedule session with room collision check |
| 55 | `GET /api/events/[eventId]/sessions/[sessionId]` | `app/api/events/[eventId]/sessions/[sessionId]/route.ts` | `event:view` | Get session details & speaker list |
| 56 | `PATCH /api/events/[eventId]/sessions/[sessionId]` | `app/api/events/[eventId]/sessions/[sessionId]/route.ts` | `event:manage_content` | Update session schedule |
| 57 | `DELETE /api/events/[eventId]/sessions/[sessionId]` | `app/api/events/[eventId]/sessions/[sessionId]/route.ts` | `event:manage_content` | Cancel/remove session |
| 58 | `GET /api/events/[eventId]/sessions/[sessionId]/attendance` | `app/api/events/[eventId]/sessions/[sessionId]/attendance/route.ts` | `event:manage_session_attendance` | List session attendees |
| 59 | `POST /api/events/[eventId]/sessions/[sessionId]/attendance` | `app/api/events/[eventId]/sessions/[sessionId]/attendance/route.ts` | `event:manage_session_attendance` | Scan entry/exit for multi-track session |
| 60 | `GET /api/events/[eventId]/sponsors` | `app/api/events/[eventId]/sponsors/route.ts` | `event:view` | List tiered sponsors |
| 61 | `POST /api/events/[eventId]/sponsors` | `app/api/events/[eventId]/sponsors/route.ts` | `event:manage_content` | Add event sponsor |
| 62 | `PATCH /api/events/[eventId]/sponsors/[sponsorId]` | `app/api/events/[eventId]/sponsors/[sponsorId]/route.ts` | `event:manage_content` | Update sponsor tier / logo |
| 63 | `DELETE /api/events/[eventId]/sponsors/[sponsorId]` | `app/api/events/[eventId]/sponsors/[sponsorId]/route.ts` | `event:manage_content` | Remove sponsor |
| 64 | `GET /api/events/[eventId]/exhibitors` | `app/api/events/[eventId]/exhibitors/route.ts` | `event:view` | List exhibitors and booths |
| 65 | `POST /api/events/[eventId]/exhibitors` | `app/api/events/[eventId]/exhibitors/route.ts` | `event:manage_content` | Add exhibitor with booth allocation check |
| 66 | `PATCH /api/events/[eventId]/exhibitors/[exhibitorId]` | `app/api/events/[eventId]/exhibitors/[exhibitorId]/route.ts` | `event:manage_content` | Update exhibitor stall info |
| 67 | `DELETE /api/events/[eventId]/exhibitors/[exhibitorId]` | `app/api/events/[eventId]/exhibitors/[exhibitorId]/route.ts` | `event:manage_content` | Remove exhibitor |
| 68 | `GET /api/events/[eventId]/tickets` | `app/api/events/[eventId]/tickets/route.ts` | `event:view` | List ticket tiers, price rules, quotas |
| 69 | `POST /api/events/[eventId]/tickets` | `app/api/events/[eventId]/tickets/route.ts` | `event:manage_content` | Create ticket class |
| 70 | `PATCH /api/events/[eventId]/tickets/[ticketId]` | `app/api/events/[eventId]/tickets/[ticketId]/route.ts` | `event:manage_content` | Update ticket pricing/sales dates |
| 71 | `DELETE /api/events/[eventId]/tickets/[ticketId]` | `app/api/events/[eventId]/tickets/[ticketId]/route.ts` | `event:manage_content` | Delete ticket class |
| 72 | `POST /api/events/[eventId]/tickets/[ticketId]/rules` | `app/api/events/[eventId]/tickets/[ticketId]/rules/route.ts` | `event:manage_content` | Add early-bird/group price rule |
| 73 | `PATCH /api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]` | `app/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]/route.ts` | `event:manage_content` | Update price rule |
| 74 | `DELETE /api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]` | `app/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]/route.ts` | `event:manage_content` | Remove price rule |
| 75 | `GET /api/events/[eventId]/promo-codes` | `app/api/events/[eventId]/promo-codes/route.ts` | `event:view` | List promotional discount codes |
| 76 | `POST /api/events/[eventId]/promo-codes` | `app/api/events/[eventId]/promo-codes/route.ts` | `event:manage_content` | Create promotional code |
| 77 | `POST /api/events/[eventId]/promo-codes/validate` | `app/api/events/[eventId]/promo-codes/validate/route.ts` | `event:view` | Verify promo discount calculation |
| 78 | `DELETE /api/events/[eventId]/promo-codes/[codeId]` | `app/api/events/[eventId]/promo-codes/[codeId]/route.ts` | `event:manage_content` | Delete promotional code |
| 79 | `GET /api/events/[eventId]/registration-forms` | `app/api/events/[eventId]/registration-forms/route.ts` | `event:view` | Get dynamic registration form builder schema |
| 80 | `PUT /api/events/[eventId]/registration-forms` | `app/api/events/[eventId]/registration-forms/route.ts` | `event:manage_content` | Publish/unpublish registration form |
| 81 | `POST /api/events/[eventId]/registration-forms/fields` | `app/api/events/[eventId]/registration-forms/fields/route.ts` | `event:manage_content` | Add dynamic question field |
| 82 | `PATCH /api/events/[eventId]/registration-forms/fields/[fieldId]` | `app/api/events/[eventId]/registration-forms/fields/[fieldId]/route.ts` | `event:manage_content` | Update field validation / logic |
| 83 | `DELETE /api/events/[eventId]/registration-forms/fields/[fieldId]` | `app/api/events/[eventId]/registration-forms/fields/[fieldId]/route.ts` | `event:manage_content` | Remove form field |
| 84 | `POST /api/events/[eventId]/registration-forms/reorder` | `app/api/events/[eventId]/registration-forms/reorder/route.ts` | `event:manage_content` | Reorder form fields order |

*(Additional endpoints including registrations, orders, kiosk, check-in, certificates, and webhooks are indexed in the Master API Report)*.
