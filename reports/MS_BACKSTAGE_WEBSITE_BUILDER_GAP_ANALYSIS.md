# MS Backstage — Website Builder Gap Analysis & Codebase Audit Report

**Date:** November 19, 2026  
**Auditor:** MS Backstage Engineering  
**Scope:** `/events/[eventSlug]/website` (Visual Editor) & `/p/[slug]` (Public Website Renderer)

---

## 1. Executive Summary

A comprehensive line-by-line inspection of the existing MS Backstage website builder implementation revealed critical functional and architectural gaps between the promised Canva/Wix-style visual editor experience and the actual browser behavior. 

Most critically, while viewport switching buttons (`Desktop`, `Tablet`, `Mobile`) resized the outer canvas container width, the internal components relied on standard Tailwind screen media queries (e.g. `md:flex`, `hidden sm:inline`). Because the user is editing in a desktop browser window (1440px wide), the CSS media queries evaluated the outer desktop window rather than the preview canvas container width. Consequently, desktop navigation items, wide buttons, and multi-column grids continued to render horizontally in the 375px/390px mobile canvas, causing severe label clipping, awkward wrapping, and layout breakage.

Furthermore, there was no independent breakpoint override system. Any font size or layout adjustment applied while in "Mobile" mode directly overwrote the global desktop values.

---

## 2. Identified Functional Gaps & Root Cause Analysis

### Gap 1: Header Navigation Overflow on Mobile Canvas
- **Symptom:** In the editor's mobile preview and on small viewports, header navigation labels are clipped horizontally or wrap awkwardly over the CTA button.
- **Root Cause:** In `app/events/[eventSlug]/website/page.tsx` line 1260, the navigation links used `<div className="hidden md:flex ...">`. When viewed inside a desktop browser at 1440px width, `md:` is active regardless of the canvas container's `max-w-[390px]`. There was no responsive hamburger drawer for mobile view.
- **Solution Required:**
  1. Header must check `previewDevice === 'mobile'` directly in the editor to switch from desktop horizontal links to a mobile hamburger menu button.
  2. Implement an accessible, animated mobile navigation drawer/sheet that reveals anchor links and auto-closes upon navigation.
  3. Mirror this behavior in `/p/[slug]/page.tsx` using responsive CSS and stateful mobile menu toggling.

### Gap 2: Lack of Wix Studio-Style Breakpoint Overrides
- **Symptom:** Edits made in Tablet or Mobile view affect the Desktop view because properties are stored in a flat element object.
- **Root Cause:** `WebsiteElement` schema in `lib/website/config.ts` stored only top-level fields (`fontSize`, `x`, `y`, `width`, `height`, `textAlign`). When the inspector updated an element, it mutated the top-level property.
- **Solution Required:**
  - Introduce `ElementBreakpointOverrides` on `WebsiteElement`:
    ```typescript
    export interface ElementBreakpointOverrides {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fontSize?: number;
      textAlign?: 'left' | 'center' | 'right';
      hidden?: boolean;
      padding?: number;
    }
    export interface WebsiteElement {
      // base desktop properties
      tablet?: ElementBreakpointOverrides;
      mobile?: ElementBreakpointOverrides;
    }
    ```
  - Implement property resolution cascade: `activeDevice === 'mobile' ? (element.mobile?.[prop] ?? element.tablet?.[prop] ?? element[prop]) : ...`.
  - When editing in mobile mode, mutations are saved to `element.mobile[prop]`, preserving desktop integrity.

### Gap 3: Hero Section Mobile Independence
- **Symptom:** Hero buttons and headline font sizes overflow on mobile screens; buttons stay side-by-side even when there is insufficient horizontal space.
- **Root Cause:** Hero rendering used fixed flex row with `flex-wrap`, but no explicit `buttonLayout` (stack vs. row) setting or mobile headline size control.
- **Solution Required:**
  - Add `heroResponsive` settings to `theme`:
    ```typescript
    heroResponsive?: {
      tablet?: { titleSize?: number; buttonLayout?: 'row' | 'stack'; textAlign?: 'left' | 'center'; paddingY?: number };
      mobile?: { titleSize?: number; buttonLayout?: 'row' | 'stack'; textAlign?: 'left' | 'center'; paddingY?: number };
    }
    ```
  - Support vertical stacking of CTA and secondary buttons on mobile.
  - Provide headline font-size slider specifically targeted to mobile.

### Gap 4: Inspector Focus & Context Switching
- **Symptom:** Clicking a child element inside Hero did not smoothly transition inspector context to element properties or button properties.
- **Root Cause:** Selection state only handled coarse `hero`, `header`, `footer`, `section`, or `element` without direct child targeting inside standard sections.
- **Solution Required:**
  - Standardize click event propagation with `e.stopPropagation()`.
  - Contextual inspector switching:
    - Click Header -> Header Settings (logo, colors, mobile menu style)
    - Click Hero background -> Hero Section Settings (overlay, image, layout)
    - Click Hero CTA -> Button Styling Inspector
    - Click Custom Element -> Element Properties (text, font, size, border, dimensions)
    - Click Custom Section -> Section Layout (columns, background, padding)
    - Click Canvas / blank area -> Global Design System (palette, typography, radii)

### Gap 5: Parity Between Canvas and Public Website (`/p/[slug]`)
- **Symptom:** Previously, public site did not render custom elements or multi-column layouts, and had diverging styling tokens.
- **Root Cause:** In `app/p/[slug]/page.tsx`, custom section rendering was missing element resolution logic.
- **Solution Required:**
  - Share the responsive element rendering and breakpoint resolution model between `VisualElementCanvas` and `/p/[slug]/page.tsx`.

---

## 3. Data-Flow Verification Matrix

| Entity | UI Inspector Control | Editor State Updated | Payload in PUT API | Neon Postgres JSONB | Load via GET API | Public Site Renderer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Header Bg Color** | `input[type="color"]` | `config.theme.headerBgColor` | Preserved via passthrough | Saved in `theme` | Restored | Applied to `<header>` |
| **Header Text Color** | `input[type="color"]` | `config.theme.headerTextColor` | Preserved via passthrough | Saved in `theme` | Restored | Applied to nav links |
| **Mobile Hamburger** | State toggle | Responsive state | Preserved | Stored in config | Restored | Functional Drawer |
| **Hero Title** | Controlled text input | `config.heroTitle` | Directly mapped in schema | Saved in `heroTitle` column | Restored | Rendered in `<h1>` |
| **Hero Photo Mode** | Toggle button | `config.theme.heroHideOverlay` | Preserved via passthrough | Saved in `theme` | Restored | Removes overlay |
| **Hero Overlay Color** | `input[type="color"]` | `config.theme.heroOverlayColor` | Preserved via passthrough | Saved in `theme` | Restored | Styled overlay `div` |
| **Hero Overlay Opacity** | Range slider (0-100) | `config.theme.heroOverlayOpacity`| Preserved via passthrough | Saved in `theme` | Restored | Opacity style `N/100` |
| **Button Radius** | Range slider (0-32px)| `config.theme.buttonBorderRadius`| Preserved via passthrough | Saved in `theme` | Restored | Inline `borderRadius` |
| **Custom Elements** | 8-point drag/resize | `sec.elements` array | Preserved via passthrough | Saved in `sectionsConfig` | Restored | Rendered on canvas & site |
| **Mobile Font Size** | Breakpoint slider | `el.mobile.fontSize` | Preserved via passthrough | Saved in `sectionsConfig` | Restored | Mobile CSS override |
| **Section Ordering** | Move up/down buttons | Array index in `sectionsConfig` | Mapped in schema | Saved in `sectionsConfig` | Restored | Order preserved |

---

## 4. Action Plan for Phase 1 - 8 Execution

1. **Schema & Models (`lib/website/config.ts`):** Extend `WebsiteElement` and `WebsiteThemeConfig` with `ElementBreakpointOverrides` and `HeroBreakpointOverrides`.
2. **Visual Canvas (`VisualElementCanvas.tsx`):** Add responsive property resolution, 8-point resize with accurate directional math, alignment tools, and canvas constraint boundaries.
3. **Inspector (`ElementPropertiesPanel.tsx`):** Add responsive breakpoint indicators, width/height manual inputs, font size slider with device-specific override indicators, alignment, and button variant controls.
4. **Editor Canvas (`app/events/[eventSlug]/website/page.tsx`):**
   - Implement functional mobile header with hamburger menu button & slide-out navigation sheet.
   - Implement responsive button stacking in Hero for mobile.
   - Implement breakpoint-aware editing: when editing in Tablet/Mobile, write to device overrides.
5. **Public Renderer (`app/p/[slug]/page.tsx`):**
   - Add stateful mobile menu hamburger drawer with smooth scroll anchor dismissal.
   - Resolve element and hero responsive overrides.
6. **Automated Playwright Testing (`scripts/verify_website_builder_interactive.mjs`):**
   - Test drag, resize, typography, button, header, hero overlay, custom section, responsive viewports (1440, 1024, 768, 390, 375, 320px), mobile hamburger menu, breakpoint persistence, and public site parity.
