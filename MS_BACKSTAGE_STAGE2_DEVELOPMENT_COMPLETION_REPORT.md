# MS Backstage — Stage 2 Development Completion Report
## Ticketing, Dynamic Pricing, Promo Codes & Dynamic Registration Form Engine

**Completion Date:** November 18, 2026  
**Project Path:** `/Users/suryakumar/Desktop/ms product`  
**Reference Product:** Zoho Backstage  
**Original Project:** `/Users/suryakumar/Desktop/cnf` *(Strictly unaccessed and untouched)*  
**Current State:** Stage 2 Fully Implemented & Validated. Ready for Stage 3 Planning.

---

## 1. Summary of Implemented Features

Stage 2 extends the existing MS Backstage multi-tenant SaaS application with a full-suite ticketing, dynamic pricing, promotional code, and customizable registration form engine comparable to Zoho Backstage.

### Key Capabilities Built:
- **Module A — Ticket Class Management:** Complete organizer desk to configure free, paid, VIP, early-bird, student, group, and custom ticket tiers. Supports real-time capacity and sales quota tracking (`totalQuantity`, `soldQuantity`, `reservedQuantity`, `availableQuantity`), order limits (`minPerOrder`, `maxPerOrder`), sale date windows, visibility controls (`public`, `hidden`, `access_code_only`), and status lifecycles (`draft`, `scheduled`, `on_sale`, `sold_out`, `paused`, `closed`).
- **Module B — Pricing & Discount Engine (`lib/ticketing/pricing.ts`):** High-precision server-side calculation engine enforcing non-negative payable amounts, mathematical guarantees, and itemized receipts. Supports tiered price rules (`ticket_price_rules`) including early-bird discounts and volume/group discounts based on quantity thresholds. Never trusts client-submitted pricing.
- **Module C — Promo Code Management Desk:** Full promotional code management supporting percentage discounts, fixed-amount cash discounts, and 100% free ticket promotions. Implements event-scoped uniqueness, start/expiry windows, ticket category eligibility restrictions, minimum order thresholds, and strict global/per-user redemption caps. Includes an interactive live calculator drawer.
- **Module D — Dynamic Registration Form Builder:** No-code drag-and-drop form canvas supporting **17 field types** (Short text, Long text, Email, Phone, Number, Dropdown, Radio, Checkbox, Date, Country, State, Address, Website URL, File upload, Consent terms, Section header, Informational guidance). Features unique field key formatting, reordering, mandatory flags, custom select options, and dynamic conditional visibility logic (fields appear based on previous answers).
- **Module E & F — Registration Engine & Order Lifecycle:** Reusable registration service connecting ticket purchases to the existing `attendees` table without schema duplication. Confirms free tickets immediately (`paymentStatus = 'Paid'`) with atomic sequential registration numbering (`registration_counters`) and QR token generation. Paid tickets remain in `pending_payment` with inventory reserved pending Stage 3 Razorpay integration. Captures dynamic respondent answers in `registration_answers`.
- **Module J & K — Frontend Desks & Event Analytics:** 4 responsive desks added under `/events/[eventSlug]/` (`tickets`, `promo-codes`, `registration-forms`, `registrations`), integrated with the AppleDock and Console Overview dashboard. Real-time KPI summaries show live ticket capacity filled, revenue metrics, free vs. paid registrations, and orders by status.

---

## 2. Exact Files Created

### Database Schema & Engine
1. [db/schema/ticketing.ts](file:///Users/suryakumar/Desktop/ms%20product/db/schema/ticketing.ts) — Additive schema defining 8 relational tables.
2. [lib/ticketing/pricing.ts](file:///Users/suryakumar/Desktop/ms%20product/lib/ticketing/pricing.ts) — Server-side pricing calculation engine with mathematical guarantees.
3. [db/migrations/0007_bizarre_whizzer.sql](file:///Users/suryakumar/Desktop/ms%20product/db/migrations/0007_bizarre_whizzer.sql) — Purely additive Drizzle PostgreSQL migration for Stage 2.

### API Route Handlers
4. [app/api/events/[eventId]/tickets/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/tickets/route.ts) — List & create ticket classes.
5. [app/api/events/[eventId]/tickets/[ticketId]/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/tickets/[ticketId]/route.ts) — Get, patch, and delete ticket class.
6. [app/api/events/[eventId]/tickets/[ticketId]/rules/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/tickets/[ticketId]/rules/route.ts) — List & create dynamic price rules.
7. [app/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]/route.ts) — Patch & delete dynamic price rule.
8. [app/api/events/[eventId]/promo-codes/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/promo-codes/route.ts) — List & create promo codes.
9. [app/api/events/[eventId]/promo-codes/[codeId]/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/promo-codes/[codeId]/route.ts) — Get, patch, and delete promo code.
10. [app/api/events/[eventId]/promo-codes/validate/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/promo-codes/validate/route.ts) — Server-side promo code validator & discount calculator.
11. [app/api/events/[eventId]/registration-forms/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registration-forms/route.ts) — Get & update registration form settings.
12. [app/api/events/[eventId]/registration-forms/fields/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registration-forms/fields/route.ts) — Append custom field to registration form.
13. [app/api/events/[eventId]/registration-forms/fields/[fieldId]/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registration-forms/fields/[fieldId]/route.ts) — Patch & delete registration field.
14. [app/api/events/[eventId]/registration-forms/reorder/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registration-forms/reorder/route.ts) — Batch reorder fields on form canvas.
15. [app/api/events/[eventId]/registrations/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registrations/route.ts) — Registration order submission engine & order listing.
16. [app/api/events/[eventId]/registrations/[orderId]/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registrations/[orderId]/route.ts) — Order details, form responses & status cancellation.
17. [app/api/events/[eventId]/registrations/stats/route.ts](file:///Users/suryakumar/Desktop/ms%20product/app/api/events/[eventId]/registrations/stats/route.ts) — Database-backed ticketing & order KPI analytics.

### Frontend Desks
18. [app/events/[eventSlug]/tickets/page.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/events/[eventSlug]/tickets/page.tsx) — Ticket Management Desk & Price Rules modal.
19. [app/events/[eventSlug]/promo-codes/page.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/events/[eventSlug]/promo-codes/page.tsx) — Promo Code Management Desk & Test Validator.
20. [app/events/[eventSlug]/registration-forms/page.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/events/[eventSlug]/registration-forms/page.tsx) — Drag-and-Drop Dynamic Form Builder & Live Preview.
21. [app/events/[eventSlug]/registrations/page.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/events/[eventSlug]/registrations/page.tsx) — Registration Overview, Order Management & Manual Attendee Register.

### Test Suites
22. [scripts/test_stage2_ticketing.mjs](file:///Users/suryakumar/Desktop/ms%20product/scripts/test_stage2_ticketing.mjs) — Automated Stage 2 Invariant & Logic Test Suite (10/10 PASS).

---

## 3. Exact Files Modified

1. [db/schema/index.ts](file:///Users/suryakumar/Desktop/ms%20product/db/schema/index.ts) — Re-exported Stage 2 ticketing entities.
2. [lib/auth/permissions.ts](file:///Users/suryakumar/Desktop/ms%20product/lib/auth/permissions.ts) — Added 5 new Stage 2 permissions and updated role permission matrices.
3. [app/components/navigation/AppleDock.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/components/navigation/AppleDock.tsx) — Integrated Stage 2 navigation links and icons into the secondary dock menu.
4. [app/events/[eventSlug]/page.tsx](file:///Users/suryakumar/Desktop/ms%20product/app/events/[eventSlug]/page.tsx) — Added Ticketing & Registration Engine section to Event Console.
5. [package.json](file:///Users/suryakumar/Desktop/ms%20product/package.json) — Added `test:stage2:ticketing` test runner script.

---

## 4. Database Tables Added

| Table Name | Primary Purpose | Foreign Keys & Isolation |
| :--- | :--- | :--- |
| `event_tickets` | Defines ticket tiers, pricing, currency, quotas, sales windows, and visibility. | References `events.id` (CASCADE) |
| `ticket_price_rules` | Configures dynamic price rules (early-bird, group/volume discounts). | References `event_tickets.id` (CASCADE), `events.id` (CASCADE) |
| `event_promo_codes` | Stores promotional coupon codes, discount types, validity, and usage limits. | References `events.id` (CASCADE), Unique `(event_id, code)` |
| `promo_code_redemptions` | Audit trail of redeemed coupons per user email with applied discount value. | References `event_promo_codes.id` (CASCADE), `events.id` (CASCADE) |
| `registration_forms` | Container for custom registration form configurations. | References `events.id` (CASCADE), Unique `event_id` |
| `registration_form_fields` | Dynamic form field questions supporting 17 types, options, and conditional logic. | References `registration_forms.id` (CASCADE), Unique `(form_id, field_key)` |
| `registration_orders` | Tracks order lifecycle, financial amounts, currency, attendee link, and status. | References `events.id` (CASCADE), `event_tickets.id` (RESTRICT), `attendees.id` (SET NULL) |
| `registration_answers` | Persists respondent answers for custom form fields linked to order and attendee. | References `registration_orders.id` (CASCADE), `attendees.id` (CASCADE) |

---

## 5. Migration File Generated

- **Migration File:** `db/migrations/0007_bizarre_whizzer.sql`
- **Safety Properties:**
  - 100% additive DDL (`CREATE TABLE`, `CREATE INDEX`, `CREATE UNIQUE INDEX`, `ALTER TABLE ... ADD CONSTRAINT`).
  - Zero `DROP TABLE`, zero `DROP COLUMN`, and zero alterations to existing operational tables (`attendees`, `events`, `organizations`, `registration_counters`).
  - Foreign key cascading properly scoped to `events.id`.
  - **Status:** Statically generated and verified. **Not applied to production** (complies with strict stop condition).

---

## 6. API Endpoints Implemented

| Endpoint | Method | RBAC Guard | Audit Action | Functionality |
| :--- | :---: | :---: | :---: | :--- |
| `/api/events/[eventId]/tickets` | GET | `event:view` | None (Read) | Lists tickets with sold/available inventory and price rules |
| `/api/events/[eventId]/tickets` | POST | `event:manage_tickets` | `ticket.create` | Creates ticket tier with sales window and quota |
| `/api/events/[eventId]/tickets/[ticketId]` | GET | `event:view` | None (Read) | Retrieves ticket details and active pricing rules |
| `/api/events/[eventId]/tickets/[ticketId]` | PATCH | `event:manage_tickets` | `ticket.update` | Updates ticket status, price, quotas, and sales window |
| `/api/events/[eventId]/tickets/[ticketId]` | DELETE | `event:manage_tickets` | `ticket.delete` | Deletes ticket (blocked if orders/sales exist) |
| `/api/events/[eventId]/tickets/[ticketId]/rules` | GET | `event:view` | None (Read) | Lists dynamic pricing rules for ticket |
| `/api/events/[eventId]/tickets/[ticketId]/rules` | POST | `event:manage_pricing` | `price_rule.create` | Creates early-bird or group discount rule |
| `/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]` | PATCH | `event:manage_pricing` | `price_rule.update` | Updates discount type, value, or active status |
| `/api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]` | DELETE | `event:manage_pricing` | `price_rule.delete` | Removes pricing rule |
| `/api/events/[eventId]/promo-codes` | GET | `event:view` | None (Read) | Lists promo codes with redemption counts and savings |
| `/api/events/[eventId]/promo-codes` | POST | `event:manage_promocodes` | `promo_code.create` | Creates event-scoped promo code with usage caps |
| `/api/events/[eventId]/promo-codes/[codeId]` | GET | `event:view` | None (Read) | Retrieves promo code details and redemption history |
| `/api/events/[eventId]/promo-codes/[codeId]` | PATCH | `event:manage_promocodes` | `promo_code.update` | Updates discount values, expiry, or active state |
| `/api/events/[eventId]/promo-codes/[codeId]` | DELETE | `event:manage_promocodes` | `promo_code.delete` | Deletes promo code |
| `/api/events/[eventId]/promo-codes/validate` | POST | `event:view` | None (Validate) | Validates promo code and returns exact calculated discount |
| `/api/events/[eventId]/registration-forms` | GET | `event:view` | None (Read) | Retrieves form configuration and field canvas (auto-initializes if missing) |
| `/api/events/[eventId]/registration-forms` | PUT | `event:manage_registration_forms` | `registration_form.update` | Updates form title, description, and published state |
| `/api/events/[eventId]/registration-forms/fields` | POST | `event:manage_registration_forms` | `registration_field.create` | Appends custom field to form (validates unique key) |
| `/api/events/[eventId]/registration-forms/fields/[fieldId]` | PATCH | `event:manage_registration_forms` | `registration_field.update` | Updates label, options, conditional logic, required flag |
| `/api/events/[eventId]/registration-forms/fields/[fieldId]` | DELETE | `event:manage_registration_forms` | `registration_field.delete` | Removes custom field (protects core name & email) |
| `/api/events/[eventId]/registration-forms/reorder` | POST | `event:manage_registration_forms` | `registration_form.reorder` | Batch updates display orders for drag-and-drop |
| `/api/events/[eventId]/registrations` | GET | `event:view_registrations` | None (Read) | Lists registration orders with search, ticket name, and status filter |
| `/api/events/[eventId]/registrations` | POST | `event:create_attendee` | `registration.submit` | Submits registration: locks inventory, creates order, creates attendee, stores answers |
| `/api/events/[eventId]/registrations/[orderId]` | GET | `event:view_registrations` | None (Read) | Retrieves order receipt, financial breakdown, and dynamic answers |
| `/api/events/[eventId]/registrations/[orderId]` | PATCH | `event:manage_tickets` | `order.update_status` | Cancels order and restores ticket inventory |
| `/api/events/[eventId]/registrations/stats` | GET | `event:view` | None (Read) | Database-backed KPI analytics on sales, revenue, and quotas |

---

## 7. Permissions Added & Centralized RBAC Enforcement

The following permissions were added to `lib/auth/permissions.ts`:

- `'event:manage_tickets'`: Granted to `org_owner`, `org_admin`, `event_manager`.
- `'event:manage_pricing'`: Granted to `org_owner`, `org_admin`, `event_manager`.
- `'event:manage_promocodes'`: Granted to `org_owner`, `org_admin`, `event_manager`.
- `'event:manage_registration_forms'`: Granted to `org_owner`, `org_admin`, `event_manager`.
- `'event:view_registrations'`: Granted to `org_owner`, `org_admin`, `event_manager`, `registration_staff`.

Restricted roles (`registration_staff`, `scanner_operator`, `org_member`) are denied ticket, pricing, promo code, and form builder mutation capabilities.

---

## 8. UI Pages and Navigation Added

1. **Ticket Classes Desk** (`/events/[eventSlug]/tickets`):
   - Inventory KPI banner (Total capacity, sold, available inventory).
   - Card grid with status tags, currency pricing, and inventory progress bars.
   - Create/Edit Ticket Drawer with sales windows and order limits.
   - Dynamic Price Rules modal for early-bird and group discounts.
2. **Promo Codes Desk** (`/events/[eventSlug]/promo-codes`):
   - Coupon cards with copy-to-clipboard, usage count, savings given, and status badges.
   - Create/Edit Promo Code drawer with usage caps, start/expiry dates, and ticket filters.
   - Interactive Test Code Calculator to simulate real-time discounts.
3. **Registration Form Builder** (`/events/[eventSlug]/registration-forms`):
   - Component palette of 17 field types with drag-and-drop / ordering arrows.
   - Field property editor with choices editor and conditional visibility configuration.
   - Live Form Preview tab allowing organizers to test attendee form experience.
   - Instant publish / draft toggle.
4. **Registrations & Orders Overview** (`/events/[eventSlug]/registrations`):
   - Real-time KPI summaries for confirmed attendees, pending payments, net revenue, and capacity.
   - Searchable orders data table with status filtering.
   - Order Details drawer with attendee registration number, badge link, financial receipt, and dynamic form answers.
   - Manual Attendee Registration modal powered by the server-side registration engine.

---

## 9. Existing Functionality Preserved

A strict regression verification confirmed that existing core operational features remain completely intact:
- **Spot Registration:** `app/events/[eventSlug]/spot-registration/page.tsx` was verified untouched.
- **QR Code Scanner:** `app/events/[eventSlug]/scanner/page.tsx` was verified untouched.
- **Badge Designer:** `app/events/[eventSlug]/badges/page.tsx` was verified untouched.
- **Attendee Directory:** `app/events/[eventSlug]/attendees/page.tsx` was verified untouched.
- **Attendee Schema:** `db/schema/attendees.ts` is 100% preserved; newly registered attendees seamlessly populate `attendees` and can immediately be scanned, have badges printed, and receive credentials.

---

## 10. Development Validation Results

| Test / Inspection Dimension | Verification Tool | Result |
| :--- | :--- | :---: |
| **Static Type Safety** | `npm run typecheck:next` (`tsc --noEmit -p tsconfig.json`) | **PASS (0 errors)** |
| **Code Quality & Linting** | `npx eslint` across all Stage 2 files | **PASS (0 errors / 0 warnings)** |
| **Stage 2 Invariant Suite** | `npm run test:stage2:ticketing` (`scripts/test_stage2_ticketing.mjs`) | **10/10 PASS (100%)** |
| **Stage 1 Regression Suite** | `npm run test:stage1:content` (`scripts/test_stage1_content.mjs`) | **10/10 PASS (100%)** |
| **Additive Migration Check** | Review of `0007_bizarre_whizzer.sql` | **PASS (100% additive)** |

---

## 11. Known Limitations

1. **Single-Attendee Order Workflow:** In accordance with the prompt guidance (*"implement a reliable single-attendee registration model first and document the limitation"*), each order currently registers one primary attendee. Multi-attendee group registration orders will be introduced in Stage 3 alongside public checkout.
2. **File Upload Storage Target:** File upload fields in the dynamic form builder are defined in the schema and form engine, ready to hook into the existing S3/object storage presigner during the Stage 3 public attendee upload phase.

---

## 12. Features Intentionally Deferred to Stage 3

In strict compliance with development instructions:
- Public event microsite and public ticketing landing pages.
- Razorpay payment checkout integration and webhook verification.
- Automated payment confirmation emails and PDF ticket receipts.
- Public QR code generation on ticket purchase.

Paid registrations created in Stage 2 cleanly transition to `status = 'pending_payment'` with ticket inventory reserved, awaiting the verified payment gateway in Stage 3.

---

## 13. Instructions for Applying Migrations in Non-Production

To apply migration `0007_bizarre_whizzer.sql` in a safe, non-production staging environment:

```bash
# 1. Ensure your non-production database URL is configured in .env.local:
# DATABASE_URL="postgresql://user:password@non-prod-host/database?sslmode=require"

# 2. Run Drizzle migration execution:
npx drizzle-kit migrate

# 3. Verify that the 8 new tables exist:
# psql $DATABASE_URL -c "\dt event_tickets"
```

> [!IMPORTANT]
> Do not apply migrations to production until authorized after the final testing phase.

---

## Conclusion & Stop Condition Met

Stage 2 development is **complete, type-safe, and fully validated**.

In compliance with Section 18:
- Development is halted.
- Stage 3 has not been started.
- Migrations have not been applied to production.
- No git commit or push has been performed.
- Awaiting your review and explicit approval before proceeding to Stage 3.
