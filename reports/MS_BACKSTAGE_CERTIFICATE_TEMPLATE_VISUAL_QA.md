# MS Backstage — 10 Certificate Templates Visual QA Report

## 1. Overview & Verification Summary

MS Backstage provides 10 built-in, production-grade certificate presets spanning corporate, technical, academic, and diplomatic event types. Each preset features a pre-calibrated canvas model with responsive dimensions, typography pairings, color harmonies, and official seals.

| # | Preset Name | Category | Border Style | Seal Type | Font Hierarchy | Status |
|---|-------------|----------|--------------|-----------|----------------|--------|
| 1 | Classic Gold Executive | Corporate & Executive | `double_gold` | `gold_crest` | Serif (Cinzel / Garamond) | Verified |
| 2 | Modern Tech Minimalist | Technology & Engineering | `geometric` | `shield_check` | Sans / Space Grotesk | Verified |
| 3 | Academic Distinction | Education & Research | `ornate` | `laurel_wreath` | Playfair / Serif | Verified |
| 4 | Medical & Clinical Fellowship | Healthcare & Science | `double_gold` | `laurel_wreath` | Formal Serif | Verified |
| 5 | Corporate Leadership | Enterprise & C-Suite | `clean_boxed` | `shield_check` | Modern Sans | Verified |
| 6 | Creative Arts & Design | Creative & Agency | `modern_line` | `star_ribbon` | Outfit / Display | Verified |
| 7 | Sports & Athletic Achievement | Athletics & Sports | `modern_line` | `star_ribbon` | High-impact Sans | Verified |
| 8 | Non-Profit & Humanitarian | Non-Profit & NGO | `vintage` | `wax_seal` | Heritage Serif | Verified |
| 9 | Legal & Compliance | Legal & Governance | `double_gold` | `gold_crest` | Traditional Serif | Verified |
| 10 | Global Summit Diplomatic | Government & Diplomatic | `ornate` | `gold_crest` | Diplomatic Roman | Verified |

---

## 2. Visual Quality Assurance Criteria

- **Clipping Prevention:** All 10 presets maintain elements within safe coordinates (Y coordinates: 6% to 92%), ensuring zero element overflow on both canvas renderers and vector PDF generation.
- **Contrast & Legibility:** Minimum 4.5:1 WCAG AA text contrast ratio maintained across light canvas backgrounds (`#fffbeb`, `#ffffff`) and dark developer themes (`#090d16`).
- **Cryptographic Seal Positioning:** Verification QR code and signatory titles are pinned to percentage coordinates `y: 80% - 90%` with clear separation from the recipient name and narrative body.
- **Dynamic Variable Injection:** All presets correctly evaluate `{{name}}`, `{{event}}`, and `{{organization}}` without causing line wraps or box overflow.
