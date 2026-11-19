# MS Backstage — Complete Feature Test Matrix (Phase 1 QA)

**Project Location:** `/Users/suryakumar/Desktop/ms product`  
**Audit Scope:** End-to-End Functional, Structural, Database & Security Mapping across All 10 Modules (A through J).  
**Verification Date:** November 19, 2026  

---

## 1. Feature Coverage Matrix (Modules A – J)

| Module | Feature | Frontend Route | API Endpoints | Database Tables | RBAC Scope | Test Scenarios | Status |
|---|---|---|---|---|---|---|---|
| **A. Organization Management** | Org Listing & Switching | `/organizations` | `GET /api/organizations` | `organizations`, `organization_members` | Authenticated | Listing, pagination, empty state | PASS |
| | Org Creation | `/organizations/new` | `POST /api/organizations` | `organizations`, `organization_members` | Authenticated | Valid create, slug uniqueness, slug validation | PASS |
| | Org Overview & Details | `/organizations/[orgSlug]` | `GET /api/organizations/[orgId]` | `organizations` | Org Member+ | Read stats, event counts | PASS |
| | Org Settings & Branding | `/organizations/[orgSlug]/settings` | `PATCH /api/organizations/[orgId]` | `organizations` | Org Admin+ | Name update, logo URL, currency, timezone | PASS |
| | Team Member Management | `/organizations/[orgSlug]/members` | `GET, PATCH /api/organizations/[orgId]/members/[memberId]` | `organization_members` | Org Admin+ | List members, promote, suspend, role change | PASS |
| | Team Member Invitations | `/organizations/[orgSlug]/invitations` | `GET, POST, DELETE /api/organizations/[orgId]/invitations` | `organization_invitations` | Org Admin+ | Send invite, duplicate guard, revoke, accept | PASS |
| | Transfer Ownership | `/organizations/[orgSlug]/settings` | `POST /api/organizations/[orgId]/transfer-ownership` | `organizations`, `organization_members` | Org Owner | Transfer to admin, demote previous owner | PASS |
| **B. Event Management** | Event Creation | `/organizations/[orgSlug]/events/new` | `POST /api/organizations/[orgId]/events` | `events`, `event_settings` | Org Admin+ | Title, slug, dates, timezone, venue | PASS |
| | Event Console Dashboard | `/events/[eventSlug]` | `GET /api/events/[eventId]` | `events`, `registration_orders`, `attendees` | Event Staff+ | Key metrics, revenue, check-in percentage | PASS |
| | Event Settings | `/events/[eventSlug]/settings` | `GET, POST /api/events/[eventId]/settings` | `event_settings` | Event Manager+ | Prefix formatting, sequence starts, currency | PASS |
| | Event Archival | `/events/[eventSlug]/settings` | `POST /api/events/[eventId]/archive` | `events` | Org Admin+ | Archival state toggle, public route deactivation | PASS |
| | Staff Desk Assignments | `/events/[eventSlug]/staff` | `GET, POST, DELETE /api/events/[eventId]/staff` | `event_staff_assignments` | Event Manager+ | Assign staff, revoke staff, role scope | PASS |
| | Operational Audit Trail | `/events/[eventSlug]/audit` | `GET /api/events/[eventId]/audit` | `audit_events` | Event Manager+ | Immutable event logs, actor tracking | PASS |
| **C. Content Foundation** | Speakers Pool & Profiles | `/events/[eventSlug]/speakers` | `GET, POST, DELETE, PATCH /api/events/[eventId]/speakers` | `speakers`, `event_speakers` | Content Manager+ | Add speaker, bio, social, photo, assign | PASS |
| | Multi-Track Agenda | `/events/[eventSlug]/agenda` | `GET, POST, DELETE, PATCH /api/events/[eventId]/tracks` | `event_tracks` | Content Manager+ | Create tracks, color coding, order | PASS |
| | Sessions & Scheduling | `/events/[eventSlug]/agenda` | `GET, POST, DELETE, PATCH /api/events/[eventId]/sessions` | `event_sessions`, `session_speakers` | Content Manager+ | Start/end times, room validation, speaker tag | PASS |
| | Sponsors Showcase | `/events/[eventSlug]/sponsors` | `GET, POST, DELETE, PATCH /api/events/[eventId]/sponsors` | `event_sponsors` | Content Manager+ | Platinum/Gold/Silver tiers, logo, links | PASS |
| | Exhibitors Directory | `/events/[eventSlug]/exhibitors` | `GET, POST, DELETE, PATCH /api/events/[eventId]/exhibitors` | `event_exhibitors` | Content Manager+ | Booth numbers, description, stall assignment | PASS |
| **D. Ticketing & Pricing** | Ticket Tiers CRUD | `/events/[eventSlug]/tickets` | `GET, POST, DELETE, PATCH /api/events/[eventId]/tickets` | `event_tickets` | Event Manager+ | Free/paid tiers, quantities, limits, sales windows | PASS |
| | Dynamic Pricing Rules | `/events/[eventSlug]/tickets` | `GET, POST, DELETE, PATCH /api/events/[eventId]/tickets/[ticketId]/rules` | `ticket_price_rules` | Event Manager+ | Early-bird discounts, bulk group pricing | PASS |
| | Promo Code Management | `/events/[eventSlug]/promo-codes` | `GET, POST, DELETE, PATCH /api/events/[eventId]/promo-codes` | `event_promo_codes`, `promo_code_redemptions` | Event Manager+ | Fixed/percent off, redemption limits, expiry | PASS |
| | Promo Validation | `/p/[slug]/register` | `POST /api/events/[eventId]/promo-codes/validate` | `event_promo_codes` | Public | Real-time validation, server-side recalculation | PASS |
| **E. Dynamic Registration Forms** | Form Configuration | `/events/[eventSlug]/registration-forms` | `GET, PUT /api/events/[eventId]/registration-forms` | `registration_forms` | Event Manager+ | Global event form settings, confirmation copy | PASS |
| | Custom Form Fields | `/events/[eventSlug]/registration-forms` | `POST, DELETE, PATCH /api/events/[eventId]/registration-forms/fields` | `registration_form_fields` | Event Manager+ | Text, dropdown, checkbox, radio, file, textarea | PASS |
| | Field Sequence Reordering | `/events/[eventSlug]/registration-forms` | `POST /api/events/[eventId]/registration-forms/reorder` | `registration_form_fields` | Event Manager+ | Drag-and-drop display order persistence | PASS |
| **F. Public Event Website** | Published Microsite | `/p/[slug]` | `GET /api/public/events/[slug]` | `event_websites`, `events` | Public | Responsive hero, nav, tickets, agenda, venue | PASS |
| | Multi-Page Custom Pages | `/p/[slug]/[pageSlug]` | `GET /api/public/events/[slug]` | `event_websites` | Public | Custom sub-page rendering, dynamic routes | PASS |
| **G. Registration & Payment** | Ticket Selection & Checkout | `/p/[slug]/register` | `POST /api/public/events/[slug]/checkout` | `inventory_reservations`, `registration_orders` | Public | Concurrency reservation, Razorpay order | PASS |
| | Payment Verification | `/p/[slug]/confirmation/[orderReference]` | `POST /api/public/events/[slug]/verify-payment` | `payment_transactions`, `registration_orders` | Public | Client callback verification | PASS |
| | Webhook Processing | N/A (Server-to-Server) | `POST /api/webhooks/razorpay` | `payment_webhook_events`, `attendees` | Razorpay HMAC | Signature verification, durable idempotency | PASS |
| | Order Summary & Retry | `/p/[slug]/confirmation/[orderReference]` | `GET, POST /api/public/orders/[orderReference]` | `registration_orders`, `ticket_documents` | Public Token | Order receipt, pass token, retry on fail | PASS |
| **H. Attendee Self-Service** | Magic Link Request | `/p/[slug]/attendee` | `POST /api/public/attendee/magic-link` | `attendee_access_tokens` | Public | Email magic token delivery, 15-min expiry | PASS |
| | Attendee Portal | `/p/[slug]/attendee` | `GET /api/public/attendee/portal` | `attendees`, `ticket_documents` | Attendee Token | View passes, download PDF tickets, QR payload | PASS |
| | Profile Update | `/p/[slug]/attendee` | `POST /api/public/attendee/profile` | `attendees` | Attendee Token | Dietary preferences, phone, emergency contact | PASS |
| **I. Onsite Operations** | Check-in Desk | `/events/[eventSlug]/check-in` | `GET, POST /api/events/[eventId]/check-in` | `attendees`, `scan_events` | Desk Staff+ | Instant lookup, 1-click check-in, duplicate guard | PASS |
| | Rapid QR Scanner | `/events/[eventSlug]/scanner` | `GET, POST /api/events/[eventId]/scan` | `scan_events`, `attendees` | Scanner Operator+ | Camera QR & hardware wedge scanner, audio cue | PASS |
| | Self-Service Kiosk | `/events/[eventSlug]/kiosk` | `POST /api/events/[eventId]/kiosk/scan` | `kiosk_sessions`, `badge_print_events` | Kiosk Token | Unattended kiosk mode, instant thermal print | PASS |
| | Spot Registration | `/events/[eventSlug]/spot-registration` | `GET, POST /api/events/[eventId]/spot-registration` | `attendees`, `spot_registration_keys` | Desk Staff+ | Walk-in registration, cash/offline collection | PASS |
| | Badge Designer | `/events/[eventSlug]/badges/designer` | `GET, POST /api/events/[eventId]/badges/layout` | `event_settings` | Event Manager+ | Drag-and-drop badge canvas, variable bindings | PASS |
| | Badge Printing Queue | `/events/[eventSlug]/badges` | `GET, POST /api/events/[eventId]/badges/print` | `badge_print_events` | Desk Staff+ | Thermal badge print trigger, queue dispatch | PASS |
| | Zone Access Control | `/events/[eventSlug]/zones` | `GET, POST, PUT, DELETE /api/events/[eventId]/zones` | `event_zones`, `zone_access_logs` | Event Manager+ | VIP/Backstage/Catering zone access scanner | PASS |
| **J. Certificates & Reports** | Certificate Studio | `/events/[eventSlug]/certificates` | `GET, POST /api/events/[eventId]/certificates` | `certificate_templates`, `issued_certificates` | Event Manager+ | 10 design templates, variable tags, issue | PASS |
| | Public Verification | `/verify/[reference]` | `GET /api/public/certificates/verify/[certificateReference]` | `issued_certificates` | Public | Cryptographic hash lookup, verification badge | PASS |
| | Attendance Analytics | `/events/[eventSlug]/analytics/attendance` | `GET /api/events/[eventId]/analytics/attendance` | `session_attendance`, `attendees` | Event Manager+ | Peak hourly arrival rates, session retention | PASS |
| | Export Reports | `/events/[eventSlug]/reports` | `GET /api/events/[eventId]/reports/export` | `attendees`, `registration_orders` | Event Manager+ | CSV stream exports for attendees, orders, scans | PASS |
