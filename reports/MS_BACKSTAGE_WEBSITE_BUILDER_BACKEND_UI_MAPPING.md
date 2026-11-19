# MS Backstage — Website Builder Backend & UI Mapping Matrix

**Date:** November 19, 2026  
**Scope:** Complete End-to-End Property Mapping from UI Controls to Neon PostgreSQL and Public Microsite

---

## 1. Property Mapping Matrix

| Property Name | UI Inspector Control | Editor State Path | API Payload Field | Neon Drizzle Column | Reload Restored? | Public Renderer Destination |
|---|---|---|---|---|:---:|---|
| **Theme Primary Color** | Hex Color Picker | `config.theme.primaryColor` | `theme.primaryColor` | `event_websites.theme (JSONB)` | Yes | CTA Buttons, Badge Accents |
| **Theme Secondary Color**| Hex Color Picker | `config.theme.secondaryColor` | `theme.secondaryColor` | `event_websites.theme (JSONB)` | Yes | Secondary Buttons, Gradients |
| **Dark Mode Toggle** | Toggle Switch | `config.theme.darkMode` | `theme.darkMode` | `event_websites.theme (JSONB)` | Yes | Site Background, Card Surface |
| **Heading Font Family** | Dropdown Selector | `config.theme.fontFamily` | `theme.fontFamily` | `event_websites.theme (JSONB)` | Yes | `fontHeading` CSS variable |
| **Header Background** | Hex Color Picker | `config.theme.headerBgColor` | `theme.headerBgColor` | `event_websites.theme (JSONB)` | Yes | `<header>` style `backgroundColor` |
| **Header Text Color** | Hex Color Picker | `config.theme.headerTextColor`| `theme.headerTextColor`| `event_websites.theme (JSONB)` | Yes | Nav anchor links `color` |
| **Header CTA Text** | Text Input | `config.theme.ctaButtonText` | `theme.ctaButtonText` | `event_websites.theme (JSONB)` | Yes | Header Button label |
| **Header CTA Color** | Hex Color Picker | `config.theme.headerCtaBg` | `theme.headerCtaBg` | `event_websites.theme (JSONB)` | Yes | Header Button `backgroundColor` |
| **Logo URL** | Text Input / File Upload | `config.logoUrl` | `logoUrl` | `event_websites.logoUrl (text)` | Yes | Header `<img>` src |
| **Hero Title** | Controlled Text Input | `config.heroTitle` | `heroTitle` | `event_websites.heroTitle (varchar)`| Yes | Hero `<h1>` text |
| **Hero Subtitle** | Controlled Textarea | `config.heroSubtitle` | `heroSubtitle` | `event_websites.heroSubtitle (text)`| Yes | Hero `<p>` subtitle text |
| **Hero Cover URL** | File Upload / URL | `config.heroCoverUrl` | `heroCoverUrl` | `event_websites.heroCoverUrl (text)`| Yes | Hero background `<img>` |
| **Hero Photo Mode** | Toggle Button | `config.theme.heroHideOverlay`| `theme.heroHideOverlay`| `event_websites.theme (JSONB)`| Yes | Toggles overlay container |
| **Hero Overlay Opacity**| Range Slider (0-100) | `config.theme.heroOverlayOpacity`| `theme.heroOverlayOpacity`| `event_websites.theme (JSONB)`| Yes | Overlay `div` opacity style |
| **Hero Overlay Color** | Hex Color Picker | `config.theme.heroOverlayColor`| `theme.heroOverlayColor`| `event_websites.theme (JSONB)`| Yes | Overlay `div` background style |
| **Hero Button Stacking**| Button Layout Toggle | `config.theme.heroResponsive.mobile.buttonLayout`| `theme.heroResponsive`| `event_websites.theme (JSONB)`| Yes | Responsive flex-col on mobile |
| **Button Border Radius**| Slider (0-32px) | `config.theme.buttonBorderRadius`| `theme.buttonBorderRadius`| `event_websites.theme (JSONB)`| Yes | All CTA buttons `borderRadius`|
| **Card Border Radius** | Slider (0-32px) | `config.theme.cardBorderRadius`| `theme.cardBorderRadius`| `event_websites.theme (JSONB)`| Yes | Section cards `borderRadius` |
| **Section Ordering** | Move Up/Down Controls | Array index in `sectionsConfig`| `sectionsConfig[].displayOrder`| `event_websites.sectionsConfig (JSONB)`| Yes | Section rendering sequence |
| **Section Visibility** | Eye Toggle Button | `sec.isVisible` | `sectionsConfig[].isVisible`| `event_websites.sectionsConfig (JSONB)`| Yes | Filtered out if `false` |
| **Custom Section Title**| Editable Text Input | `sec.title` | `sectionsConfig[].title`| `event_websites.sectionsConfig (JSONB)`| Yes | Section heading `<h2>` |
| **Custom Section Layout**| Dropdown (Stack/2-Col)| `sec.layout` | `sectionsConfig[].layout`| `event_websites.sectionsConfig (JSONB)`| Yes | Grid class (`grid-cols-2`)|
| **Custom Section Bg** | Hex Color Picker | `sec.bgColor` | `sectionsConfig[].bgColor`| `event_websites.sectionsConfig (JSONB)`| Yes | Section container background |
| **Element Position X** | Drag Handle / Slider | `element.x` | `sectionsConfig[].elements[].x`| `event_websites.sectionsConfig (JSONB)`| Yes | Visual canvas `left: X%` |
| **Element Position Y** | Drag Handle / Slider | `element.y` | `sectionsConfig[].elements[].y`| `event_websites.sectionsConfig (JSONB)`| Yes | Visual canvas `top: Y%` |
| **Element Width** | 8-pt Resize / Slider | `element.width` | `sectionsConfig[].elements[].width`| `event_websites.sectionsConfig (JSONB)`| Yes | Element `width: W%` |
| **Element Height** | 8-pt Resize / Slider | `element.height` | `sectionsConfig[].elements[].height`| `event_websites.sectionsConfig (JSONB)`| Yes | Element `height: Hpx` |
| **Element Text Content**| Textarea / Inline Edit | `element.content` | `sectionsConfig[].elements[].content`| `event_websites.sectionsConfig (JSONB)`| Yes | Element text node |
| **Element Font Size** | Slider (11-64px) | `element.fontSize` | `sectionsConfig[].elements[].fontSize`| `event_websites.sectionsConfig (JSONB)`| Yes | Element `fontSize: Npx` |
| **Mobile Font Size** | Device Breakpoint Slider| `element.mobile.fontSize`| `sectionsConfig[].elements[].mobile`| `event_websites.sectionsConfig (JSONB)`| Yes | Mobile CSS override |
| **Element Font Family**| Dropdown Selector | `element.fontFamily` | `sectionsConfig[].elements[].fontFamily`| `event_websites.sectionsConfig (JSONB)`| Yes | Element inline `fontFamily`|
| **Button Text** | Text Input | `element.buttonText` | `sectionsConfig[].elements[].buttonText`| `event_websites.sectionsConfig (JSONB)`| Yes | Button text label |
| **Button Link / Anchor**| Dropdown / URL Input | `element.buttonLink` | `sectionsConfig[].elements[].buttonLink`| `event_websites.sectionsConfig (JSONB)`| Yes | Button `href` attribute |
| **Button Background** | Hex Color Picker | `element.buttonBg` | `sectionsConfig[].elements[].buttonBg`| `event_websites.sectionsConfig (JSONB)`| Yes | Button `backgroundColor` |
| **Button Text Color** | Hex Color Picker | `element.buttonTextColor`| `sectionsConfig[].elements[].buttonTextColor`| `event_websites.sectionsConfig (JSONB)`| Yes | Button `color` |
| **SEO Meta Title** | Text Input | `config.seoTitle` | `seoTitle` | `event_websites.seoTitle (varchar)` | Yes | `<title>` and OpenGraph tag |
| **SEO Description** | Textarea | `config.seoDescription` | `seoDescription` | `event_websites.seoDescription (text)` | Yes | `<meta name="description">` |

---

## 2. API Contract & Persistence Guarantees

1. The API route `PUT /api/events/[eventId]/website` uses Zod with `.passthrough()` on both `theme` and items of `sectionsConfig`. This guarantees that additive responsive breakpoint settings (`tablet`, `mobile`) and custom elements pass without filtering.
2. The `eventWebsites` table stores `theme` and `sectionsConfig` as native PostgreSQL `JSONB` datatypes, providing indexable, structured storage with zero performance degradation.
3. Every save emits an audit log record via `recordAuditEvent()` with action `event:update_website_builder`.
