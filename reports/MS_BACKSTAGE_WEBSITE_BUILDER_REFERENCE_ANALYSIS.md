# MS Backstage — Website Builder Reference Product Analysis

**Date:** November 19, 2026  
**Scope:** Functional and Behavioral Reference Analysis (Canva, Wix Studio, Zoho Backstage)  
**Target Module:** MS Backstage Event Website Builder (`/events/[eventSlug]/website`) & Public Experience (`/p/[slug]`)

---

## 1. Reference Product Breakdown

### A. Zoho Backstage (Event Website Reference)
*Source: Zoho Backstage publicly available documentation and product guides (Event Website Builder & Microsite Design).*

- **Core Event Workflow:**
  - Direct integration between event backend primitives (Tickets, Agenda, Speakers, Sponsors, Venue) and website presentation blocks.
  - Predefined structured modules that auto-populate from database tables when active, with organizer ability to customize section titles, backgrounds, and ordering.
  - Multi-page navigation (Home, Agenda, Registration, Speakers) with smooth scroll anchor support for single-page microsites.
  - Header branding customization (Event Logo, Organizer Name, CTA Button linked to registration desk).
- **Adopted in MS Backstage:**
  - Predefined Event Modules (Tickets, Agenda, Speakers, Sponsors, Venue, FAQ, Countdown, Exhibitors) directly connected to event data.
  - Event-specific CTA buttons ("Register Now", "Select Passes") linking automatically to `/p/[slug]/register` or anchor `#tickets`.
  - Seamless toggle between single-page microsite anchor navigation and multi-page sub-routes.

---

### B. Wix Studio (Responsive Breakpoint & Layout Reference)
*Source: Wix Studio Editor publicly available documentation (Designing Across Breakpoints, Setting Element Size, Inspector Panel).*

- **Cascading Breakpoint Model:**
  - Cascading inheritance: Base styles defined at the desktop breakpoint (1024px+) cascade down to Tablet (768px-1023px) and Mobile (320px-767px).
  - Overrides made at smaller breakpoints (e.g. reducing mobile font size from 48px to 28px, changing flex direction from row to column) do not alter the parent desktop style.
  - Fluid vs. Fixed Sizing: Elements support fixed pixel sizes or responsive percentages (`%` width/positioning).
  - Docking & Stacking: Containers can automatically wrap or stack child elements (e.g. side-by-side action buttons stack vertically on mobile screens).
- **Adopted in MS Backstage:**
  - Tri-breakpoint responsive editor (`Desktop: 100% / max-w-5xl`, `Tablet: 768px`, `Mobile: 390px/375px`).
  - Additive `ElementBreakpointOverrides` on `WebsiteElement`:
    ```typescript
    interface ElementBreakpointOverrides {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fontSize?: number;
      textAlign?: 'left' | 'center' | 'right';
      hidden?: boolean;
    }
    ```
  - Mobile button stacking: Hero action buttons switch from flex row to flex column when viewport is narrow.
  - Responsive Mobile Header: Replaces wide horizontal link lists with an accessible slide-out navigation sheet.

---

### C. Canva (Direct Visual Manipulation Reference)
*Source: Canva publicly accessible design and layout editing behaviors.*

- **Direct Canvas Interaction:**
  - Direct selection of elements with clear bounding box indicators.
  - 8-point resize handles enabling proportional or directional expansion.
  - Floating contextual action bar positioned directly above or below the selected element (Duplicate, Lock/Unlock, Layer Ordering, Alignment, Delete).
  - Double-click inline text editing.
  - Drag-and-drop with alignment snapping and coordinate updates.
  - Keyboard shortcuts (Cmd/Ctrl+Z for Undo, Cmd/Ctrl+Y for Redo, Cmd/Ctrl+D for Duplicate, Backspace/Delete, Arrow keys for nudging).
- **Adopted in MS Backstage:**
  - `VisualElementCanvas.tsx`: Floating action toolbar on selection, 8-directional resize handles (NW, N, NE, E, SE, S, SW, W) with 2% snap grid.
  - Inline double-click editing for text elements.
  - Coordinate sliders (X, Y, Width, Height) in the right inspector panel synchronized bidirectionally with canvas drag and resize.

---

## 2. Architecture Alignment for MS Backstage

The integration of these reference behaviors preserves MS Backstage's core architecture:
1. **Next.js 14 App Router & React 18:** Standard client-side state hooks (`useState`, `useRef`, `useCallback`) with server-side public page rendering.
2. **Neon PostgreSQL & Drizzle ORM:** The `event_websites` table contains `jsonb` columns `theme` and `sectionsConfig`, allowing rich breakpoint overrides, custom elements, and typography tokens to persist without breaking migrations.
3. **Multi-Tenancy & RBAC:** All website endpoints verify `requireEventContext(eventId)` and `assertPermission('event:manage_website')`.
4. **Separation of Concerns:** Editor tools are active only on the authorized `/events/[eventSlug]/website` route; `/p/[slug]` remains a fast, public, accessible event microsite with zero editor JavaScript overhead.
