# MS Backstage — Browser Console & Network Reliability Report

**Project:** MS Backstage  
**Date:** November 18, 2026  
**Auditor:** Frontend Platform & Network Performance Engineering Group

---

## 1. Executive Summary

This report analyzes browser runtime behavior, client-side console warnings/errors, network payloads, API response statuses, and hydration stability across MS Backstage. All reported runtime errors and network failures have been resolved.

---

## 2. Browser Console Error Audit & Resolution

| Error / Warning Pattern | Offending Location | Impact | Resolution Status | Verified Resolution |
|---|---|---|---|---|
| `Functions cannot be passed directly to Client Components... {$$typeof: ..., render: function Calendar}` | `app/organizations/[orgSlug]/page.tsx` | Complete page crash with error boundary | **RESOLVED** | Removed `'use client'` from `EmptyState.tsx`, allowing isomorphic rendering. |
| `localhost:3333 says An unexpected error occurred while processing your request.` | `app/events/[eventSlug]/kiosk/page.tsx` | Disruptive browser modal alert | **RESOLVED** | Replaced `window.alert()` with non-blocking `toast.error()` via `useToast`. |
| `Session opened in another window/tab. Retiring old tab session view.` | `app/components/navigation/CustomerServiceFloatingWidget.tsx` | Locked out users opening second tab | **RESOLVED** | Removed aggressive `BroadcastChannel` script; multi-tab browsing now seamless. |
| `Unnecessary escape character: \+` | `app/api/events/[eventId]/reports/export/route.ts` | ESLint build warning / potential regex ambiguity | **RESOLVED** | Fixed regex from `/^[=\+\-@\t\r]/` to `/^[=+\-@\t\r]/`. |
| `relation "event_tickets" does not exist (code 42P01)` | Database queries on `/api/events/[slug]/tickets` | HTTP 500 Network Error | **RESOLVED** | Applied database migrations `0006`, `0007`, `0008`, `0009`. |
| `relation "kiosk_sessions" does not exist (code 42P01)` | Database queries on `/api/events/[slug]/kiosk/session` | HTTP 500 Network Error | **RESOLVED** | Applied database migrations `0006`, `0007`, `0008`, `0009`. |
| `relation "event_sessions" does not exist (code 42P01)` | Database queries on `/api/events/[slug]/sessions` | HTTP 500 Network Error | **RESOLVED** | Applied database migrations `0006`, `0007`, `0008`, `0009`. |

---

## 3. Network Tab Status & Payload Audit

Network tab requests across all authenticated and public flows were inspected:

### Public Pages
- `GET /` -> HTTP 200 OK (Clean HTML stream, CSS/JS bundles loaded)
- `GET /features` -> HTTP 200 OK (Clean HTML stream)
- `GET /pricing` -> HTTP 200 OK (Clean HTML stream)
- `GET /auth/sign-in` -> HTTP 200 OK (Zero console warnings)

### Authenticated Organization Pages
- `GET /organizations` -> HTTP 200 OK (Loads organization cards without layout shifts)
- `GET /organizations/apex-events` -> HTTP 200 OK (Renders workspace without RSC serialization error)
- `GET /organizations/apex-events/settings` -> HTTP 200 OK (Fetches settings cleanly)
- `GET /organizations/apex-events/members` -> HTTP 200 OK (Loads member table)

### Event Console & Management Pages
- `GET /events/apex-summit-2026/agenda` -> HTTP 200 OK (Fetches tracks, sessions, speakers via parallel sub-requests)
- `GET /events/apex-summit-2026/tickets` -> HTTP 200 OK (Returns ticket classes and price rules)
- `GET /events/apex-summit-2026/promo-codes` -> HTTP 200 OK (Returns discount codes with redemption metrics)
- `GET /events/apex-summit-2026/kiosk` -> HTTP 200 OK (Activates session token without 500 error)
- `GET /events/apex-summit-2026/check-in` -> HTTP 200 OK (Real-time desk search operates with zero lag)

---

## 4. Verification Conclusion

All network requests return appropriate HTTP status codes (200, 201, 400 for client validation errors, 403 for unauthorized attempts, 404 for non-existent entities). Zero 500 Internal Server Errors were observed in the live server logs.
