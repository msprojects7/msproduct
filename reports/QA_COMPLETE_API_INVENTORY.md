# MS Backstage — Complete Backend API Route Inventory (Phase 1 QA)

**Project Location:** `/Users/suryakumar/Desktop/ms product`  
**Audit Timestamp:** 2026-11-19T15:10:00+05:30  
**Audit Scope:** 100% of Next.js 14 API Route Handlers (`app/api/**/route.ts`).  
**Ground-Truth Count:** **87 API Route Handlers**, covering 135+ HTTP method implementations (Updated from previous outdated 84-endpoint count).

---

## 1. Summary by Functional Domain

| Category | Route Count | HTTP Methods Covered | Primary Security / Guard Mechanism |
|---|---|---|---|
| **Authentication & Session** | 5 | GET, POST | Rate limiting, bcrypt/JWT, Neon Auth, strict production demo-lockout |
| **Platform Administration & Health** | 2 | GET | Platform admin verification, Liveness check |
| **Billing & Webhooks** | 2 | POST | Razorpay cryptographic HMAC-SHA256 signature verification, Idempotency keys |
| **Captcha Security** | 1 | GET | Turnstile / Anti-bot verification token generator |
| **Draft Management** | 2 | GET, POST, DELETE | User session isolation |
| **Invitations & Team Member Access** | 5 | GET, POST, DELETE, PATCH | Organization ownership / admin RBAC verification |
| **Organization Management** | 7 | GET, POST, PATCH | Tenant boundary scoping, ownership transfer verification |
| **Event Foundation & Settings** | 4 | GET, POST, PATCH | Multi-tenant event scoping, archive safeguards |
| **Content Management (Speakers/Tracks/Sessions/Sponsors/Exhibitors)** | 10 | GET, POST, DELETE, PATCH | Event Manager / Content Manager RBAC |
| **Ticketing, Rules & Promo Codes** | 7 | GET, POST, DELETE, PATCH | Server-side pricing recalculation, inventory concurrency checks |
| **Registration Forms & Dynamic Fields** | 4 | GET, POST, PUT, DELETE, PATCH | Schema validation, display order preservation |
| **Registrations & Order Processing** | 3 | GET, POST, PATCH | Transactional locking, ticket token generation |
| **Onsite Check-in, Scanner & Kiosk** | 6 | GET, POST, DELETE | Device session tokens, duplicate check-in rejection |
| **Zone Access Control** | 2 | GET, POST, PUT, DELETE | Zone credential verification, real-time access logging |
| **Badge Printing & Layouts** | 3 | GET, POST | Layout JSON persistence, print queue tracking |
| **Certificates Studio & Verification** | 2 | GET, POST | Neon Postgres JSONB canvas model, tamper-proof reference hash |
| **Reports & Export** | 2 | GET | Attendance aggregations, CSV/JSON stream generation |
| **Website Studio Persistence** | 1 | GET, PUT | Native JSONB theme & section persistence |
| **Public Attendee Microsite & Checkout** | 8 | GET, POST | Rate limited, public tokenized access, zero credential exposure |
| **Staff Desk Management** | 2 | GET, POST, DELETE | Role assignment verification |
| **Bulk Attendee Operations & Import** | 3 | GET, POST, DELETE | XLSX/CSV parsing, chunked database insertions |

---

## 2. Complete Inventory of All 87 API Route Handlers

| # | Route URL Path | Source File | HTTP Methods | Auth / Context Guard | Primary Purpose |
|---|---|---|---|---|---|
| 1 | `/api/auth/[...path]` | `app/api/auth/[...path]/route.ts` | POST | Public | Neon Auth handler proxy |
| 2 | `/api/auth/demo-accounts` | `app/api/auth/demo-accounts/route.ts` | GET | Non-Prod Only (404 in Prod) | Seeded demo credentials for QA testing |
| 3 | `/api/auth/otp/send` | `app/api/auth/otp/send/route.ts` | POST | Public (Rate limited) | Send one-time login passcode |
| 4 | `/api/auth/otp/verify` | `app/api/auth/otp/verify/route.ts` | POST | Public (Rate limited) | Verify login passcode & create session |
| 5 | `/api/auth/register` | `app/api/auth/register/route.ts` | POST | Public | User self-registration |
| 6 | `/api/billing/webhook` | `app/api/billing/webhook/route.ts` | POST | Webhook Signature Guard | SaaS subscription events |
| 7 | `/api/captcha` | `app/api/captcha/route.ts` | GET | Public | Mathematical / Turnstile challenge |
| 8 | `/api/drafts` | `app/api/drafts/route.ts` | GET, POST | User Session | List & create temporary event drafts |
| 9 | `/api/drafts/[draftId]` | `app/api/drafts/[draftId]/route.ts` | DELETE | User Session | Delete draft |
| 10 | `/api/events` | `app/api/events/route.ts` | GET | User Session | List accessible events |
| 11 | `/api/events/[eventId]` | `app/api/events/[eventId]/route.ts` | GET, PATCH | Event Staff+ | Read / update event details |
| 12 | `/api/events/[eventId]/analytics/attendance` | `app/api/events/[eventId]/analytics/attendance/route.ts` | GET | Event Manager+ | Attendance rate & breakdown stats |
| 13 | `/api/events/[eventId]/archive` | `app/api/events/[eventId]/archive/route.ts` | POST | Org Admin+ | Archive event |
| 14 | `/api/events/[eventId]/attendees` | `app/api/events/[eventId]/attendees/route.ts` | GET, POST | Desk Staff+ | Attendee directory & manual creation |
| 15 | `/api/events/[eventId]/attendees/[attendeeId]` | `app/api/events/[eventId]/attendees/[attendeeId]/route.ts` | GET, DELETE, PATCH | Desk Staff+ | Read, update, or remove attendee |
| 16 | `/api/events/[eventId]/attendees/bulk-delete` | `app/api/events/[eventId]/attendees/bulk-delete/route.ts` | POST | Event Manager+ | Bulk attendee deletion |
| 17 | `/api/events/[eventId]/audit` | `app/api/events/[eventId]/audit/route.ts` | GET | Event Manager+ | Operational event audit logs |
| 18 | `/api/events/[eventId]/badges/layout` | `app/api/events/[eventId]/badges/layout/route.ts` | GET, POST | Event Manager+ | Badge designer layout config |
| 19 | `/api/events/[eventId]/badges/print` | `app/api/events/[eventId]/badges/print/route.ts` | GET, POST | Desk Staff+ | Execute badge print job |
| 20 | `/api/events/[eventId]/badges/queue` | `app/api/events/[eventId]/badges/queue/route.ts` | GET | Desk Staff+ | View badge print queue |
| 21 | `/api/events/[eventId]/certificates` | `app/api/events/[eventId]/certificates/route.ts` | GET, POST | Event Manager+ | Certificate templates & batch issue |
| 22 | `/api/events/[eventId]/check-in` | `app/api/events/[eventId]/check-in/route.ts` | GET, POST | Desk Staff+ | Check-in attendee & stats |
| 23 | `/api/events/[eventId]/check-in/override` | `app/api/events/[eventId]/check-in/override/route.ts` | POST | Event Manager+ | Manual supervisor check-in override |
| 24 | `/api/events/[eventId]/exhibitors` | `app/api/events/[eventId]/exhibitors/route.ts` | GET, POST | Content Manager+ | List & create event exhibitors |
| 25 | `/api/events/[eventId]/exhibitors/[exhibitorId]` | `app/api/events/[eventId]/exhibitors/[exhibitorId]/route.ts` | DELETE, PATCH | Content Manager+ | Modify / delete exhibitor |
| 26 | `/api/events/[eventId]/import` | `app/api/events/[eventId]/import/route.ts` | GET, POST | Event Manager+ | Excel/CSV attendee bulk import |
| 27 | `/api/events/[eventId]/kiosk/scan` | `app/api/events/[eventId]/kiosk/scan/route.ts` | POST | Kiosk Token | Self-service kiosk badge print scan |
| 28 | `/api/events/[eventId]/kiosk/session` | `app/api/events/[eventId]/kiosk/session/route.ts` | GET, POST, DELETE | Desk Staff+ | Initialize / revoke kiosk session |
| 29 | `/api/events/[eventId]/promo-codes` | `app/api/events/[eventId]/promo-codes/route.ts` | GET, POST | Event Manager+ | List & create promo discounts |
| 30 | `/api/events/[eventId]/promo-codes/[codeId]` | `app/api/events/[eventId]/promo-codes/[codeId]/route.ts` | GET, DELETE, PATCH | Event Manager+ | Manage single promo discount |
| 31 | `/api/events/[eventId]/promo-codes/validate` | `app/api/events/[eventId]/promo-codes/validate/route.ts` | POST | Public / Staff | Validate discount promo code |
| 32 | `/api/events/[eventId]/registration-forms` | `app/api/events/[eventId]/registration-forms/route.ts` | GET, PUT | Event Manager+ | Fetch / update dynamic form config |
| 33 | `/api/events/[eventId]/registration-forms/fields` | `app/api/events/[eventId]/registration-forms/fields/route.ts` | POST | Event Manager+ | Add dynamic form custom field |
| 34 | `/api/events/[eventId]/registration-forms/fields/[fieldId]` | `app/api/events/[eventId]/registration-forms/fields/[fieldId]/route.ts` | DELETE, PATCH | Event Manager+ | Modify / remove custom field |
| 35 | `/api/events/[eventId]/registration-forms/reorder` | `app/api/events/[eventId]/registration-forms/reorder/route.ts` | POST | Event Manager+ | Reorder custom field sequence |
| 36 | `/api/events/[eventId]/registrations` | `app/api/events/[eventId]/registrations/route.ts` | GET, POST | Desk Staff+ | View / create registration orders |
| 37 | `/api/events/[eventId]/registrations/[orderId]` | `app/api/events/[eventId]/registrations/[orderId]/route.ts` | GET, PATCH | Desk Staff+ | Manage specific registration order |
| 38 | `/api/events/[eventId]/registrations/stats` | `app/api/events/[eventId]/registrations/stats/route.ts` | GET | Event Manager+ | Registration revenue & ticket counts |
| 39 | `/api/events/[eventId]/reports` | `app/api/events/[eventId]/reports/route.ts` | GET | Event Manager+ | Operational report aggregations |
| 40 | `/api/events/[eventId]/reports/export` | `app/api/events/[eventId]/reports/export/route.ts` | GET | Event Manager+ | Download CSV attendee/order export |
| 41 | `/api/events/[eventId]/scan` | `app/api/events/[eventId]/scan/route.ts` | GET, POST | Scanner Operator+ | Scanner portal lookup & scan log |
| 42 | `/api/events/[eventId]/sessions` | `app/api/events/[eventId]/sessions/route.ts` | GET, POST | Content Manager+ | Event sessions directory |
| 43 | `/api/events/[eventId]/sessions/[sessionId]` | `app/api/events/[eventId]/sessions/[sessionId]/route.ts` | GET, DELETE, PATCH | Content Manager+ | Manage single session |
| 44 | `/api/events/[eventId]/sessions/[sessionId]/attendance` | `app/api/events/[eventId]/sessions/[sessionId]/attendance/route.ts` | GET, POST | Scanner Operator+ | Session-level access tracking |
| 45 | `/api/events/[eventId]/settings` | `app/api/events/[eventId]/settings/route.ts` | GET, POST | Event Manager+ | Event sequence & venue settings |
| 46 | `/api/events/[eventId]/speakers` | `app/api/events/[eventId]/speakers/route.ts` | GET, POST | Content Manager+ | Event speakers directory |
| 47 | `/api/events/[eventId]/speakers/[speakerId]` | `app/api/events/[eventId]/speakers/[speakerId]/route.ts` | DELETE, PATCH | Content Manager+ | Manage single event speaker |
| 48 | `/api/events/[eventId]/sponsors` | `app/api/events/[eventId]/sponsors/route.ts` | GET, POST | Content Manager+ | Event sponsors directory |
| 49 | `/api/events/[eventId]/sponsors/[sponsorId]` | `app/api/events/[eventId]/sponsors/[sponsorId]/route.ts` | DELETE, PATCH | Content Manager+ | Manage single event sponsor |
| 50 | `/api/events/[eventId]/spot-registration` | `app/api/events/[eventId]/spot-registration/route.ts` | GET, POST | Desk Staff+ | Onsite desk spot registration |
| 51 | `/api/events/[eventId]/staff` | `app/api/events/[eventId]/staff/route.ts` | GET, POST | Event Manager+ | Event staff assignments list |
| 52 | `/api/events/[eventId]/staff/[assignmentId]` | `app/api/events/[eventId]/staff/[assignmentId]/route.ts` | DELETE | Event Manager+ | Revoke staff assignment |
| 53 | `/api/events/[eventId]/tickets` | `app/api/events/[eventId]/tickets/route.ts` | GET, POST | Event Manager+ | Ticket tiers directory |
| 54 | `/api/events/[eventId]/tickets/[ticketId]` | `app/api/events/[eventId]/tickets/[ticketId]/route.ts` | GET, DELETE, PATCH | Event Manager+ | Manage single ticket tier |
| 55 | `/api/events/[eventId]/tickets/[ticketId]/rules` | `app/api/events/[eventId]/tickets/[ticketId]/rules/route.ts` | GET, POST | Event Manager+ | Pricing rules (early-bird, bulk) |
| 56 | `/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]` | `app/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]/route.ts` | DELETE, PATCH | Event Manager+ | Manage single pricing rule |
| 57 | `/api/events/[eventId]/tracks` | `app/api/events/[eventId]/tracks/route.ts` | GET, POST | Content Manager+ | Agenda tracks directory |
| 58 | `/api/events/[eventId]/tracks/[trackId]` | `app/api/events/[eventId]/tracks/[trackId]/route.ts` | DELETE, PATCH | Content Manager+ | Manage single agenda track |
| 59 | `/api/events/[eventId]/website` | `app/api/events/[eventId]/website/route.ts` | GET, PUT | Event Manager+ | Save & fetch Website Studio config |
| 60 | `/api/events/[eventId]/zones` | `app/api/events/[eventId]/zones/route.ts` | GET, POST, PUT, DELETE | Event Manager+ | Zone access control directory |
| 61 | `/api/events/[eventId]/zones/scan` | `app/api/events/[eventId]/zones/scan/route.ts` | POST | Scanner Operator+ | Zone access validation scan |
| 62 | `/api/health` | `app/api/health/route.ts` | GET | Public | Database & API liveness check |
| 63 | `/api/invitations/accept` | `app/api/invitations/accept/route.ts` | POST | User Session | Accept organization invitation |
| 64 | `/api/organizations` | `app/api/organizations/route.ts` | GET, POST | User Session | List & create tenant organizations |
| 65 | `/api/organizations/[orgId]` | `app/api/organizations/[orgId]/route.ts` | GET, PATCH | Org Member+ | Read / update organization info |
| 66 | `/api/organizations/[orgId]/deactivate` | `app/api/organizations/[orgId]/deactivate/route.ts` | POST | Org Owner | Deactivate organization |
| 67 | `/api/organizations/[orgId]/events` | `app/api/organizations/[orgId]/events/route.ts` | GET, POST | Org Member+ | List / create events in organization |
| 68 | `/api/organizations/[orgId]/invitations` | `app/api/organizations/[orgId]/invitations/route.ts` | GET, POST | Org Admin+ | Manage team invitations |
| 69 | `/api/organizations/[orgId]/invitations/[invitationId]` | `app/api/organizations/[orgId]/invitations/[invitationId]/route.ts` | DELETE | Org Admin+ | Cancel team invitation |
| 70 | `/api/organizations/[orgId]/members` | `app/api/organizations/[orgId]/members/route.ts` | GET | Org Member+ | List organization team members |
| 71 | `/api/organizations/[orgId]/members/[memberId]` | `app/api/organizations/[orgId]/members/[memberId]/route.ts` | PATCH | Org Admin+ | Update member organization role |
| 72 | `/api/organizations/[orgId]/members/[memberId]/status` | `app/api/organizations/[orgId]/members/[memberId]/status/route.ts` | PATCH | Org Admin+ | Suspend / activate member |
| 73 | `/api/organizations/[orgId]/speakers` | `app/api/organizations/[orgId]/speakers/route.ts` | GET, POST | Org Member+ | Global speaker pool directory |
| 74 | `/api/organizations/[orgId]/speakers/[speakerId]` | `app/api/organizations/[orgId]/speakers/[speakerId]/route.ts` | GET, DELETE, PATCH | Org Member+ | Manage single global speaker |
| 75 | `/api/organizations/[orgId]/subscription` | `app/api/organizations/[orgId]/subscription/route.ts` | GET, POST | Org Owner | Subscription tier & billing |
| 76 | `/api/organizations/[orgId]/transfer-ownership` | `app/api/organizations/[orgId]/transfer-ownership/route.ts` | POST | Org Owner | Transfer primary ownership |
| 77 | `/api/public/attendee/magic-link` | `app/api/public/attendee/magic-link/route.ts` | POST | Public (Rate limited) | Request attendee portal login link |
| 78 | `/api/public/attendee/portal` | `app/api/public/attendee/portal/route.ts` | GET | Attendee Token | Fetch attendee registrations & passes |
| 79 | `/api/public/attendee/profile` | `app/api/public/attendee/profile/route.ts` | POST | Attendee Token | Update attendee profile details |
| 80 | `/api/public/certificates/verify/[certificateReference]` | `app/api/public/certificates/verify/[certificateReference]/route.ts` | GET | Public | Verify certificate cryptographic hash |
| 81 | `/api/public/events/[slug]` | `app/api/public/events/[slug]/route.ts` | GET | Public | Public event published microsite payload |
| 82 | `/api/public/events/[slug]/checkout` | `app/api/public/events/[slug]/checkout/route.ts` | POST | Public (Rate limited) | Reserve tickets & create Razorpay order |
| 83 | `/api/public/events/[slug]/verify-payment` | `app/api/public/events/[slug]/verify-payment/route.ts` | POST | Public | Client verification callback |
| 84 | `/api/public/orders/[orderReference]` | `app/api/public/orders/[orderReference]/route.ts` | GET | Public Token | Fetch confirmed order summary |
| 85 | `/api/public/orders/[orderReference]/retry` | `app/api/public/orders/[orderReference]/retry/route.ts` | POST | Public Token | Re-initiate failed payment order |
| 86 | `/api/public/tickets/download/[ticketToken]` | `app/api/public/tickets/download/[ticketToken]/route.ts` | GET | Public Token | Download PDF/JSON digital ticket |
| 87 | `/api/webhooks/razorpay` | `app/api/webhooks/razorpay/route.ts` | POST | Razorpay HMAC Guard | Durable idempotency payment webhook |
