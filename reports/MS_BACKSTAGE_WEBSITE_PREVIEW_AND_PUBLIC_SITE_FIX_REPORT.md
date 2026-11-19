# MS BACKSTAGE — WEBSITE PREVIEW & PUBLIC SITE FIX REPORT

## 1. Executive Summary
This report documents the resolution of critical crashes and rendering failures on the public event microsite (`/p/[slug]`) and within the Website Builder live preview iframe.

---

## 2. Root Cause Analysis & Fixes

### Issue 1: Public Website 500 Crash on `/p/summit-26`
- **Symptom:** Visiting `http://localhost:3333/p/summit-26` triggered an unhandled Next.js error:
  `Failed query: select ... from "event_websites" where "event_websites"."event_id" = "events"."id" limit $1`
  `errorMissingRTE: missing FROM-clause entry for table "events"`
- **Root Cause:** In `app/p/[slug]/page.tsx`, `generateMetadata` queried `eventWebsites` with `where(eq(eventWebsites.eventId, events.id))` instead of selecting `event.id` from the resolved event record and passing `where(eq(eventWebsites.eventId, event.id))`. PostgreSQL threw error `42P01` because `events` was not part of the `FROM` clause in that specific sub-query.
- **Resolution:** Updated `app/p/[slug]/page.tsx`:
  ```ts
  const [event] = await db
    .select({ id: events.id, name: events.name })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event) return { title: 'Event Not Found' };

  const [website] = await db
    .select()
    .from(eventWebsites)
    .where(eq(eventWebsites.eventId, event.id))
    .limit(1);
  ```
- **Verification:** Verified via `curl -I http://localhost:3333/p/summit-26` which returns **HTTP/1.1 200 OK**.

---

### Issue 2: Live Preview Iframe Blocked by Security Headers
- **Symptom:** Live preview tab in Website Builder showed blank/blocked iframe.
- **Root Cause:** Global security headers in `next.config.mjs` declared:
  - `frame-ancestors 'none';` (in Content-Security-Policy)
  - `X-Frame-Options: DENY`
  These headers instructed the browser to block any framing of the application, even by itself on the same origin (`http://localhost:3333`).
- **Resolution:** Added route-specific overrides in `next.config.mjs` targeting `/p/:path*`:
  - `Content-Security-Policy`: Specified `frame-ancestors 'self'` and added `https://images.unsplash.com` to `img-src`.
  - `X-Frame-Options`: Set to `SAMEORIGIN`.
  - Maintained `frame-ancestors 'none'` and `X-Frame-Options: DENY` on all other application routes (`/`, `/events/:path*`, `/organizations/:path*`) to retain defense-in-depth against third-party clickjacking.
- **Verification:** Verified that `/` returns `X-Frame-Options: DENY`, while `/p/summit-26` returns `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`.

---

### Issue 3: Responsive Viewport Controls
- **Implementation:** Added a responsive viewport frame switcher to `app/events/[eventSlug]/website/page.tsx`:
  - **Desktop:** `max-w-[1440px] h-[750px]`
  - **Tablet:** `w-[768px] h-[750px]`
  - **Mobile:** `w-[390px] h-[750px]`
  - Included interactive reload button and external tab shortcut.
- **Result:** Organizers can audit and preview their public microsite in all three screen form factors before publishing.
