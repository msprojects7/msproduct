# MS Backstage — Security & Multi-Tenant Isolation Audit Report

## 1. Executive Summary

This report assesses the security architecture and multi-tenant isolation guarantees of MS Backstage across database operations, API routes, and client sessions.

---

## 2. Multi-Tenant Isolation Architecture

1. **Strict Scoping via PostgreSQL Foreign Keys:**
   - Every tenant data entity (`events`, `attendees`, `event_zones`, `event_websites`, `event_certificate_templates`, `audit_events`) contains mandatory foreign keys to either `organization_id` or `event_id` with `ON DELETE CASCADE`.
2. **Centralized Authentication & RBAC Layer (`lib/auth/context.ts`):**
   - Every API endpoint and server-side layout resolves context via `requireOrgContext` or `requireEventContext`.
   - **Zero Trust Stale Claims:** Role and membership status are queried **live** from Neon PostgreSQL on every request. Client tokens or forged claims cannot bypass permission checks.
   - **Cross-Tenant Leakage Test:** Automated tests in `scripts/test_demo_logins.mjs` verify that external users attempting to access another tenant's event or organization receive strict `403 Forbidden` / `NOT_AN_ORGANIZATION_MEMBER` rejections.

---

## 3. Security Hardening Measures

- **HTTP Security Headers:**
  - `X-Frame-Options: SAMEORIGIN` applied selectively to public event microsite routes for the Website Builder live responsive preview frame, while administrative routes enforce `X-Frame-Options: DENY`.
  - Content Security Policy (`frame-ancestors 'self'`) prevents clickjacking while allowing in-app preview rendering.
- **Race Condition Prevention in Check-In:**
  - `SELECT FOR UPDATE` serializes concurrent QR scans for the same attendee, preventing duplicate badges and phantom headcounts.
- **Demo Accounts Production Lockout:**
  - Dev-only demo accounts endpoint `/api/auth/demo-accounts` enforces hard `404 Not Found` in production (`NODE_ENV === 'production'` or `ENABLE_DEMO_ACCOUNTS === 'false'`).
- **Cryptographic Certificate Verification:**
  - Issued certificates feature nonces and unique verification tokens (`refIdx`, `tokenIdx`) that can be validated publicly without disclosing attendee PII.
