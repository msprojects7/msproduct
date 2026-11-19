# MS Backstage vs Zoho Backstage — Detailed Feature Parity Matrix

## 1. Executive Parity Assessment

This document provides a feature-by-feature evaluation comparing MS Backstage to Zoho Backstage. Rather than asserting blanket parity, this audit categorizes features into **Full Parity**, **Superior / Enhanced in MS Backstage**, and **Identified Gaps / Future Enhancements**.

---

## 2. Parity Comparison Matrix

| Module / Feature | Zoho Backstage | MS Backstage | Comparison Verdict & Implementation Status |
|------------------|----------------|--------------|--------------------------------------------|
| **Multi-Tenant Workspaces** | Portal & Organization based | Multi-tenant with Org switcher | **Full Parity** (Neon PostgreSQL tenant isolation with live DB checks) |
| **Role-Based Access Control** | Admin, Manager, Staff | 5 Distinct Roles | **Superior** (Platform Admin, Org Owner, Event Manager, Registration Staff, Scanner Operator with strict RBAC) |
| **Speaker & Faculty Hub** | Speaker profiles & session tagging | Organization-wide & event-level speakers | **Full Parity** (Cross-event speaker reuse, photo URLs, session links) |
| **Multi-Track Agenda** | Tracks, rooms, time slots | Tracks, rooms, parallel time slots | **Full Parity** (Multi-track schedule with room assignments and multi-speaker sessions) |
| **Sponsors & Exhibitors** | Tier ordering & booth allocation | Tier ordering, Booth IDs, URLs | **Full Parity** (Platinum/Gold/Silver tiering with exhibitor booth dimensions) |
| **Ticket Classes & Pricing** | Paid, Free, Early Bird | Paid, Free, Donation, Early Bird, Group rules | **Full Parity** (Dynamic price rules engine with validity dates and quantity tiers) |
| **Promo Codes & Vouchers** | Fixed & Percentage coupons | Percentage, Fixed, Free passes | **Full Parity** (Usage limits, expiry windows, per-ticket restrictions) |
| **Registration Form Engine** | Custom attendee questions | Dynamic drag-and-drop form engine | **Full Parity** (Text, Dropdown, Checkbox, Radio, File upload, Validation rules) |
| **Multi-Attendee Orders** | Bulk purchase with individual assignment | Multi-attendee order intake with individual badges | **Full Parity** (Stage 3 batch registration engine) |
| **Payment Gateway** | Stripe, PayPal, Razorpay | Razorpay Checkout Integration | **Full Parity** (Webhook verification, HMAC signatures, order reconciliation) |
| **Event Website Builder** | Multi-page builder with templates | Multi-page builder with 10 templates | **Full Parity** (Page manager, asset manager, custom slugs, subpage routing) |
| **Interactive Badge Designer** | Fixed dimensions visual editor | Visual vector canvas designer | **Superior** (Thermal badge presets: 4x6, 4x3, CR80 credit card, SVG rendering) |
| **Onsite Check-In Desk** | Mobile app & web scanner | Web camera + USB handheld scanner desk | **Full Parity** (Sub-second scan validation, duplicate scan blocking, audio chimes) |
| **Zone Access Control** | Access rules & zone scanning | `event_zones` & `zone_access_logs` desk | **Full Parity** (Live occupancy counters, capacity limits, entry/exit logging) |
| **Certificate Studio** | Template generator | Canva-style interactive visual editor | **Superior** (Object dragging, 8 resize handles, A4/Letter formats, 10 presets) |
| **Attendance Analytics** | Check-in graphs & session counts | Peak arrival curves, session footfall, dwell times | **Superior** (Real-time arrival rate charts, retention rates, exportable reports) |
| **Native Mobile App (iOS/Android)** | Dedicated Backstage app on App Store | Progressive Web App (PWA) / Responsive Web | **Gap** (MS Backstage operates as a responsive web app; native mobile app is roadmap) |
| **Abstract / Paper Submission** | Call for papers submission portal | Deferred | **Gap** (Roadmap item for academic and scientific congresses) |
| **Attendee Networking / 1:1 Meetings**| Attendee meeting booking app | Deferred | **Gap** (Roadmap item for attendee networking portal) |
