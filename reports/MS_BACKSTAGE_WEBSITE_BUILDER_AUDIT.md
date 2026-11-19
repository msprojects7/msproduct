# MS BACKSTAGE — WEBSITE BUILDER ARCHITECTURE & FUNCTIONAL AUDIT

## 1. Executive Summary
This audit inspects the MS Backstage Website Builder architecture located at `/Users/suryakumar/Desktop/ms product`. The Website Builder allows event organizers to curate public microsites (`/p/[slug]`) complete with customizable themes, section ordering, branding assets, typography hierarchy, and ticket purchase flows comparable to Zoho Backstage.

## 2. Component Structure & Data Flow
- **Editor Route:** `app/events/[eventSlug]/website/page.tsx`
- **Public Microsite Route:** `app/p/[slug]/page.tsx`
- **API Endpoint:** `app/api/events/[eventId]/website/route.ts`
- **Database Schema:** `db/schema/public_experience.ts` (`eventWebsites` table)
- **Template Library:** `lib/website/templates.ts`

### Schema Mapping
The `event_websites` table persists:
- `is_published`: boolean toggle to activate/deactivate public access.
- `theme`: `jsonb` column storing colors (`primaryColor`, `secondaryColor`, `accentColor`), `templateId`, `gradientStyle`, `fontHeading`, `fontBody`, `heroLayout`, `cardStyle`, `orgLogoUrl`, and `darkMode`.
- `hero_title` & `hero_subtitle`: Custom headline and narrative.
- `hero_cover_url` & `logo_url`: High-resolution banner and brand crests.
- `sections_config`: `jsonb` array preserving custom order and visibility for:
  - `about` (Event Narrative & Mission)
  - `tickets` (Ticket Classes & Tier Rules)
  - `speakers` (Keynote Faculty Grid)
  - `agenda` (Multi-Track Sessions & Rooms)
  - `sponsors` (Tiered Partner Wall)
  - `exhibitors` (Expo Floor & Booths)
  - `contact` (Venue Address & Coordination)

## 3. Visual Editing Capabilities
The builder provides 6 specialized workspaces:
1. **10 Website Templates:** Ready-made design presets for conferences, tech summits, leadership forums, venture demo days, academic colloquiums, creative design weeks, B2B expos, bootcamps, and VIP galas.
2. **Hero & Content:** Banner titles, subtitles, cover photo presets (Unsplash CDN integration), separate event logo vs organization logo controls, narrative text, and venue coordinates.
3. **Branding & Visual Studio:** Hex and swatch color pickers, linear/radial/mesh gradients, font families (Plus Jakarta Sans, Space Grotesk, Playfair Display, Cinzel, Outfit, Inter), hero layout mode switcher, card surface aesthetics, and dark mode toggles.
4. **Section Ordering & Visibility:** Drag/reorder arrows and visibility toggles to show/hide sections dynamically.
5. **SEO & Social:** OpenGraph meta titles, meta descriptions, and social profile links.
6. **Live Responsive Preview:** Desktop (1440px), Tablet (768px), and Mobile (390px) responsive frame controls with real-time reload.

## 4. Security & Isolation Verification
- **RBAC Enforcement:** `requireEventContext(eventId)` verifies caller permissions (`event:view` for GET, `event:edit` for PUT).
- **Tenant Boundary:** Website records are strictly keyed on `eventId` and `organizationId`. Cross-tenant mutations return 403 Forbidden.
- **CSP & Framing:** Same-origin frame ancestors (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`) allow the organizer portal to safely render live previews inside an iframe while preventing external clickjacking.
