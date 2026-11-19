# MS Backstage — Canva-Style Certificate Editor Audit Report

## 1. Executive Summary

This report documents the architectural overhaul of the **MS Backstage Certificate Studio** into an interactive Canva-style certificate design platform. The previous editor was constrained to a static modal with fixed 16:10 aspect ratio and hardcoded coordinate boxes, causing wax seals and signatory lines to clip at the bottom of the container. 

The new implementation introduces `lib/certificates/canvasModel.ts` and `app/components/certificates/CanvaCertificateDesigner.tsx`, featuring a 3-panel professional design workspace, multi-format dimension switching (A4 and US Letter in landscape and portrait), normalized percentage coordinates, full layer order management, 8 vector resize handles, and interactive typography and insignia customization.

---

## 2. Technical Architecture & Data Model

### 2.1 Schema Definition (`lib/certificates/canvasModel.ts`)

```typescript
export interface CanvasElement {
  id: string;
  type: 'title' | 'recipient' | 'body' | 'event_name' | 'org_name' | 'signatory' | 'logo' | 'seal' | 'qr' | 'shape' | 'line' | 'text' | 'image';
  x: number;       // Percentage coordinate (0 to 100)
  y: number;       // Percentage coordinate (0 to 100)
  width: number;   // Percentage coordinate (0 to 100)
  height: number;  // Percentage coordinate (0 to 100)
  rotation: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  content?: string;
  fontFamily?: 'serif' | 'sans' | 'mono' | 'display' | 'script';
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  sealType?: 'gold_crest' | 'laurel_wreath' | 'shield_check' | 'star_ribbon' | 'wax_seal' | 'none';
  sealColor?: string;
}

export interface CertificateCanvasModel {
  format: 'a4_landscape' | 'a4_portrait' | 'letter_landscape' | 'letter_portrait';
  aspectRatio: number;
  background: {
    type: 'solid' | 'gradient' | 'parchment' | 'dark' | 'image' | 'mesh';
    color: string;
    gradient?: string;
    imageUrl?: string;
    opacity?: number;
  };
  border: {
    enabled: boolean;
    style: 'double_gold' | 'geometric' | 'ornate' | 'minimal' | 'dark_foil' | 'clean_boxed' | 'none';
    color: string;
    width: number;
    inset: number;
  };
  elements: CanvasElement[];
}
```

---

## 3. Key Capabilities Implemented

1. **Object Manipulation & Interaction:**
   - Click to select any element on canvas.
   - 8 interactive vector drag handles (Top-Left, Top-Right, Bottom-Left, Bottom-Right, Top-Edge, Bottom-Edge, Left-Edge, Right-Edge).
   - Drag-to-reposition with percentage-based responsive scaling so certificates never distort across screen sizes.
   - Element locking (`locked: true`) and visibility toggle (`hidden: true`).

2. **Dimensions & Formats (No Clipping):**
   - **A4 Landscape:** 297 × 210 mm (Aspect Ratio: 1.414)
   - **A4 Portrait:** 210 × 297 mm (Aspect Ratio: 0.707)
   - **US Letter Landscape:** 11 × 8.5 in (Aspect Ratio: 1.294)
   - **US Letter Portrait:** 8.5 × 11 in (Aspect Ratio: 0.773)
   - Safe printing margin enforcement (`safeMargin: 4%`) guarantees wax seals, signatory lines, and QR verification blocks are never clipped.

3. **Insignia, Signatures & Variable Chips:**
   - Quick merge variables: `{{name}}`, `{{event}}`, `{{organization}}`, `{{issue_date}}`.
   - Real-time cryptographic verification QR code preview.
   - Dual signatory support with signature image URLs and designated titles.
   - High-fidelity vector seals: Sovereign Crest, Laurel Wreath, Shield Check, Star Ribbon, and Heritage Wax Seal.

4. **Persistence:**
   - Serialized JSON format stored directly in `event_certificate_templates.body_text` with full backwards compatibility for legacy templates.
