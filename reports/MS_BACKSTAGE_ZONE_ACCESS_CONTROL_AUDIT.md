# MS Backstage — Zone Access Control Audit Report

## 1. Executive Summary

This report documents the implementation and verification of **Zone Access Control & Venue Gate Operations** in MS Backstage. Zoho Backstage provides zone access rules to restrict specialized areas (VIP Lounges, Speaker Lounges, Workshop Rooms, Media Lounges, Backstage Pass Zones). MS Backstage now delivers equivalent zone management, capacity enforcement, real-time headcount monitoring, and gate validation APIs.

---

## 2. Database Schema & Architecture

### 2.1 Table: `event_zones`
- `id`: UUID Primary Key
- `event_id`: Foreign Key to `events.id` (CASCADE)
- `name`: String (e.g. "VIP Keynote Lounge", "Speaker Green Room", "Main Hall")
- `location`: Venue room or floor identifier
- `capacity`: Maximum allowed occupants (`0` = unlimited)
- `open_time` & `close_time`: Operating hours window
- `is_active`: Gate toggle
- `allowed_ticket_types`: JSON array of allowed ticket categories (e.g. `["VIP", "Speaker"]`)
- `allowed_roles`: JSON array of allowed staff roles

### 2.2 Table: `zone_access_logs`
- `id`: UUID Primary Key
- `event_id`: Foreign Key to `events.id`
- `zone_id`: Foreign Key to `event_zones.id`
- `attendee_id`: Foreign Key to `attendees.id`
- `action`: `'check_in' | 'check_out'`
- `status`: `'granted' | 'denied'`
- `denial_reason`: String (`TICKET_CLASS_RESTRICTED`, `CAPACITY_REACHED`, `ZONE_INACTIVE`, etc.)
- `scanned_at`: Timestamp
- `staff_user_id`: Operator ID
- `device_info`: Terminal or handheld scanner identifier

---

## 3. API Endpoints Verified

1. `GET /api/events/[eventId]/zones`
   - Returns all configured zones with real-time occupancy calculations: `headcount = COUNT(granted check_in) - COUNT(granted check_out)`.
   - Returns recent 20 zone access logs.
2. `POST /api/events/[eventId]/zones`
   - Creates a new zone with access rules.
3. `PUT /api/events/[eventId]/zones`
   - Updates zone parameters, capacity limits, and operating hours.
4. `DELETE /api/events/[eventId]/zones`
   - Deletes a zone and cascades access logs.
5. `POST /api/events/[eventId]/zones/scan`
   - Gate validator: verifies ticket category against `allowed_ticket_types`, checks `capacity`, logs the event, and returns immediate granted/denied status.

---

## 4. UI Operations Desk (`/events/[eventSlug]/zones`)

- **Interactive Gate Scanner:** Dropdown to switch zones, toggle between Entry Scan and Exit Scan, barcode input, and instant visual feedback banner (Green Granted / Red Denied with failure reason).
- **Live Headcount Gauges:** Visual progress bar showing capacity utilization (e.g. `21 / 25 seats (84%)`).
- **Zone Configuration Modal:** Add/Edit zones with multi-select pills for ticket presets (VIP, Delegate, Speaker, Press, Exhibitor).
- **Real-Time Audit Ledger:** Displays immutable live scan timeline.
