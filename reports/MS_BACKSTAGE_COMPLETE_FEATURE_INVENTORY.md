# MS Backstage — Complete Feature Inventory & Functional Specifications

**Project:** MS Backstage Event Management Platform  
**Location:** `/Users/suryakumar/Desktop/ms product`  
**Date:** November 18, 2026  
**Scope:** Full Functional Audit across Stages 1, 2, 3, and 4.

---

## 1. Feature Architecture Overview

MS Backstage provides a multi-tenant event management platform modeled on Zoho Backstage. The architecture spans seven core functional pillars:
1. **Tenant Workspaces & Multi-Role Identity**
2. **Content Foundation (Speakers, Tracks, Sessions, Sponsors, Exhibitors)**
3. **Ticketing, Dynamic Pricing & Promotional Engine**
4. **Dynamic Registration Form Engine**
5. **Public Experience, Razorpay Payments & Digital Tickets**
6. **Onsite Operations (Check-In Desk, Self Kiosk, Thermal Badge Printing)**
7. **Post-Event Intelligence (Attendance Footfall Analytics & Vector Certificates)**

---

## 2. Pillar-by-Pillar Functional Breakdown

### Pillar 1: Tenant Workspaces & Multi-Role Identity
- **Enterprise Isolation:** Multi-tenant composite keys (`organizationId`, `eventId`, `userId`) isolate data between distinct organizations.
- **5 Centralized Roles:**
  - `platform_admin`: Cross-tenant system management, billing, global audit logs.
  - `org_owner`: Full billing, member invitations, ownership transfer, organization destruction.
  - `org_admin` / `event_manager`: Event creation, schedule management, ticketing, forms, staff assignments.
  - `registration_staff`: Spot registration, attendee detail edits, manual check-in overrides, queue-driven badge printing.
  - `scanner_operator`: High-speed barcode/QR attendance verification; strictly blocked from attendee PII and event reconfiguration.
- **Session Security:** Neon Auth with cryptographic session tokens, JWT local validation, brute-force rate-limiting, and self-hosted mathematical CAPTCHA.

### Pillar 2: Stage 1 Content Foundation
- **Organization Speaker Library:** Centralized speaker profiles (bio, title, company, photo, social links) reusable across unlimited conferences.
- **Event Speaker Associations:** Selective linking of speakers to specific events with custom badges, display ordering, and featured keynote flags.
- **Multi-Track Agenda Builder:** Tracks with designated room names, seating capacities, and distinct hex color identifiers.
- **Session Scheduler:** Datetime boundary checking (preventing sessions outside event scheduled dates), room collision prevention (detecting overlapping times in the same room), and multi-speaker assignments per session.
- **Tiered Sponsorship:** Tier ranking (`Title` > `Platinum` > `Gold` > `Silver` > `Bronze` > `Partner` > `Custom`) with automated display ordering and link management.
- **Exhibitor & Booth Allocation:** Booth number enforcement preventing duplicate stall allocations within an event.

### Pillar 3: Stage 2 Ticketing & Pricing Rules
- **Ticket Classes:** Free, Paid, and Donation ticket categories with inventory caps, sales start/end windows, per-order min/max constraints, and visibility toggles (`public`, `hidden`, `access_code_only`).
- **Dynamic Price Rules:** Automatic tier calculation supporting Early Bird discounts and Group bulk-purchase thresholds.
- **Promotional Codes:** Fixed currency and percentage discounts with minimum spend requirements, total redemption caps, and per-user limits.
- **Pricing Engine Guarantees:** Strict non-negative payable guarantee (`netPayableAmount >= 0`), discount stacking limits, and deterministic rounding to 2 decimal places.

### Pillar 4: Stage 2 Dynamic Registration Form Engine
- **Field Palette:** 14 customizable field types: short text, textarea, email, phone, number, dropdown, radio buttons, checkboxes, date picker, country, state, mailing address, URL, and file upload.
- **Form Builder Controls:** Drag-and-drop reordering, required flags, placeholder customization, helper text, and regex pattern validation.
- **Conditional Visibility:** Deterministic logic evaluating dependencies (e.g., reveal Dietary Requirements only when "Attending Luncheon Banquet" equals "Yes").
- **Audit & Answers:** Individual attendee response storage mapped to submission records with immutability guarantees.

### Pillar 5: Stage 3 Public Experience, Checkout & Digital Tickets
- **Public Microsite:** Responsive event website featuring hero banner, interactive countdown timer, speaker grid, multi-track agenda, sponsor showcase, and location map.
- **Website Builder:** Live organizer studio for branding, accent themes, custom copy, and section visibility toggles.
- **Multi-Attendee Cart:** Purchase workflows allowing one buyer to purchase multiple passes across different ticket classes in a single transaction.
- **Razorpay Checkout:** Secure payment order creation, client-side signature cryptographic validation, and idempotent webhook processing (`payment_webhook_events`).
- **Digital Tickets:** Pure vector PDF generation (`%PDF-1.4`) with embedded cryptographic QR codes and email delivery tracking.

### Pillar 6: Stage 4 Onsite Operations Desk
- **Operations Check-In Desk:** Real-time search by registration number, attendee name, email, or badge QR token, featuring one-click attendance check-in.
- **Supervisor Override:** Role-gated check-in override for disputed or previously checked-in attendees with mandatory audit justification.
- **Self-Service Kiosk Mode:** Locked fullscreen kiosk terminal for touchless attendee arrival using external barcode wedges or QR readers.
- **Queue-Driven Badge Printing:** Dedicated printing queue with instant ESC/POS thermal command generation, custom badge templates, and physical print job event tracking.

### Pillar 7: Stage 4 Intelligence & Certificates
- **Attendance Analytics:** Real-time check-in rates, hourly footfall distribution, track-by-track capacity utilization, and no-show statistics.
- **Certificates Studio:** Customizable certificate templates with dynamic merge tokens (`{{name}}`, `{{event_name}}`, `{{registration_number}}`, `{{date}}`).
- **Cryptographic PDF Certificates:** Pure vector PDF certificate generator (`%PDF-1.4`) with public QR code verification URL linking to `/p/[slug]/certificate/[reference]`.
- **Attendee Self-Service Portal:** Passwordless magic link access for registered attendees to download tickets, view personalized agendas, and access certificates.

---

## 3. Verification Status

All 7 feature pillars are fully implemented in the active codebase and verified through automated end-to-end test execution.
