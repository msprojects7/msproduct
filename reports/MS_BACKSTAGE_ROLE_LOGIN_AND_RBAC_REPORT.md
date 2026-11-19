# MS Backstage — Multi-Role Authentication, Demo Logins & RBAC Enforcement Report

**Project:** MS Backstage  
**Date:** November 18, 2026  
**Auditor:** Information Security & Identity Architecture Team

---

## 1. Multi-Role Demo Credentials

For testing and administrative review, the system seeds 5 distinct role accounts with deterministic credentials in non-production environments:

| Role Name | Demo Email | Role Key | Default Password | Initial Landing Destination | Primary Permissions & Responsibilities |
|---|---|---|---|---|---|
| **Platform Administrator** | `admin@msbackstage.internal` | `platform_admin` | `Password123!@#` | `/dashboard` | Cross-tenant administration, plan quota overrides, global audit review |
| **Organization Owner** | `owner@apexevents.internal` | `org_owner` | `Password123!@#` | `/organizations/apex-events` | Full tenant ownership, billing, team member management, event creation |
| **Event Manager** | `manager@apexevents.internal` | `event_manager` | `Password123!@#` | `/events/apex-summit-2026` | Agenda, ticketing, speakers, sponsors, staff assignments, reports |
| **Registration Desk Staff** | `staff@apexevents.internal` | `registration_staff` | `Password123!@#` | `/events/apex-summit-2026/spot-registration` | Attendee registration, badge printing, check-in operations, detail edits |
| **Scanner Operator** | `scanner@apexevents.internal` | `scanner_operator` | `Password123!@#` | `/events/apex-summit-2026/scanner` | Rapid QR check-in & multi-track session scanning; zero PII access |

---

## 2. Centralized RBAC Permission Matrix

The application's authorization engine (`lib/auth/permissions.ts` and `lib/auth/context.ts`) evaluates permissions dynamically:

| Permission Identifier | Description | `platform_admin` | `org_owner` | `org_admin` | `event_manager` | `registration_staff` | `scanner_operator` |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `platform:manage` | Global system administration | **YES** | NO | NO | NO | NO | NO |
| `org:view` | View organization workspace | **YES** | **YES** | **YES** | **YES** | NO | NO |
| `org:update` | Edit organization details | **YES** | **YES** | **YES** | NO | NO | NO |
| `org:delete` | Deactivate/delete organization | **YES** | **YES** | NO | NO | NO | NO |
| `org:manage_members` | Invite/remove team members | **YES** | **YES** | **YES** | NO | NO | NO |
| `org:create_event` | Create new events | **YES** | **YES** | **YES** | NO | NO | NO |
| `event:view` | Access event console | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| `event:update_settings` | Update event configuration | **YES** | **YES** | **YES** | **YES** | NO | NO |
| `event:manage_content` | Speakers, tracks, sponsors, tickets | **YES** | **YES** | **YES** | **YES** | NO | NO |
| `event:manage_staff` | Assign and remove event staff | **YES** | **YES** | **YES** | **YES** | NO | NO |
| `event:view_attendee_pii` | View emails, phones, custom fields | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:create_attendee` | Spot registration | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:update_attendee` | Edit attendee details | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:print_badge` | Print badges | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:scan_badge` | Scan QR attendance tokens | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| `event:manage_checkin` | Check-In desk operations | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| `event:override_checkin` | Supervisor check-in override | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:manage_kiosk` | Activate kiosk terminal | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:manage_session_attendance` | Multi-track session scanning | **YES** | **YES** | **YES** | **YES** | **YES** | **YES** |
| `event:view_attendance_analytics` | Footfall and attendance reports | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:manage_badge_printing` | Printer configuration & queue | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:manage_certificates` | Design certificate templates | **YES** | **YES** | **YES** | **YES** | NO | NO |
| `event:issue_certificates` | Issue certificates to attendees | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `event:revoke_certificates` | Revoke issued certificates | **YES** | **YES** | **YES** | **YES** | NO | NO |

---

## 3. Security Boundary Verification

Automated security verification (`scripts/test_demo_logins.mjs` and `scripts/verify_application_stabilization.mjs`) confirmed:
1. **Production Lockout:** Demo accounts route (`/api/auth/demo-accounts`) strictly returns HTTP 404 in production or when `ENABLE_DEMO_ACCOUNTS=false`.
2. **Scanner Operator Isolation:** Scanner operators attempting to access `/settings` or `/registrations` endpoints are rejected with HTTP 403 Forbidden.
3. **Cross-Tenant Access Denial:** Users authenticated under Organization A attempting to read resources in Organization B are strictly denied with HTTP 404 Not Found.
4. **Credential Verification:** Authentication requests with mismatched or invalid passwords are systematically rejected with HTTP 401 Unauthorized.
