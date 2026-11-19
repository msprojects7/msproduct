# MS Backstage — Multi-Page Event Website Builder Audit Report

## 1. Executive Summary

This report documents the implementation of the **Multi-Page Event Website Platform** for MS Backstage, matching Zoho Backstage's website creation capabilities. Previously, public event websites were restricted to single-page anchor scrolling. The platform now supports multi-page architectures where organizers can manage independent subpages with custom routes, unique headlines, individual section compositions, and dynamic navbar tabs.

---

## 2. Architecture & Subpage Routing

### 2.1 Dynamic App Router Structure

- **Homepage / Overview:** `app/p/[slug]/page.tsx`
- **Dynamic Subpage Engine:** `app/p/[slug]/[pageSlug]/page.tsx`
- **Public Registration:** `app/p/[slug]/register/page.tsx`
- **Attendee Self-Service Portal:** `app/p/[slug]/attendee/page.tsx`
- **Order Confirmation & Passes:** `app/p/[slug]/confirmation/[orderReference]/page.tsx`
- **Credential Verification:** `app/p/[slug]/certificate/[certificateReference]/page.tsx`

### 2.2 Standard Multi-Page Site Composition

Every event website starts with 6 core pages configured out of the box:
1. **Home / Overview (`/p/[slug]`):** Hero banner, highlights, keynote preview, pass tiers, sponsor wall.
2. **About Event (`/p/[slug]/about`):** Detailed narrative, mission pillars, host organization profile, committee credentials.
3. **Keynote Faculty (`/p/[slug]/speakers`):** Complete speaker directory with photos, titles, company affiliations, and bios.
4. **Schedule & Tracks (`/p/[slug]/agenda`):** Multi-track schedule, room allocations, session timings, and speaker links.
5. **Passes & Registration (`/p/[slug]/tickets`):** Ticket class cards, early bird pricing rules, available quotas, direct checkout links.
6. **Venue & Access (`/p/[slug]/venue`):** Venue address, transit guide, parking logistics, accommodation options, contact desk.

---

## 3. Pages Manager Features

- **Add Custom Subpage:** Configure page title, custom URL slug, navbar label, headline, and introductory narrative.
- **Reorder Pages:** Move pages up and down to change navbar tab display order.
- **Set Homepage:** Designate which page serves as the root landing page (`/p/[slug]`).
- **Publish / Draft Toggle:** Hide unready subpages from public navigation without deleting configurations.
- **Delete Confirmation:** Protected deletion preventing accidental loss of pages with safeguards against deleting the primary homepage.
