/**
 * MS Backstage — Client-Side High-Resolution Certificate Exporter (PNG & PDF)
 *
 * Renders the Certificate Canvas Model directly to an HTML5 Canvas at 1920x1200+
 * resolution and exports either as lossless PNG or vector/high-res PDF.
 */

import { CertificateCanvasModel, CanvasElement } from './canvasModel';
import QRCode from 'qrcode';

function interpolate(text: string | undefined, vars: Record<string, string>): string {
  if (!text) return '';
  return text
    .replace(/\{\{name\}\}/gi, vars.name || vars.recipientName || 'Dr. Sarah Jenkins')
    .replace(/\{\{event\}\}/gi, vars.event || vars.eventName || 'Global Tech Summit 2026')
    .replace(/\{\{organization\}\}/gi, vars.organization || vars.orgName || 'MS Backstage Organization')
    .replace(/\{\{date\}\}/gi, vars.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
}

/**
 * Draws rounded rectangle path on Canvas 2D context.
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Multi-line text wrapping helper for HTML5 Canvas.
 * Breaks text into lines bounded by maxWidth, centers or aligns text,
 * and renders with exact line spacing.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right' = 'center'
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const word = words[n];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  const totalBlockHeight = lines.length * lineHeight;
  // Compute Y so the entire block is vertically centered around startY
  const firstLineY = startY - (totalBlockHeight / 2) + (lineHeight / 2);

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, firstLineY + (i * lineHeight));
  }

  return lines.length;
}

/**
 * Renders an entire certificate model into a High-DPI HTML5 Canvas.
 */
export async function renderCertificateToCanvas(
  model: CertificateCanvasModel,
  variables: Record<string, string> = {},
  targetWidthParam?: number
): Promise<HTMLCanvasElement> {
  // Ensure all Google Fonts / web fonts are loaded prior to measurement and drawing
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font API not supported in test runner
    }
  }

  const isLandscape = model.format !== 'a4_portrait';
  // 300 DPI standard A4 dimensions (297 x 210 mm)
  const defaultWidth = isLandscape ? 3508 : 2480;
  const targetWidth = targetWidthParam || defaultWidth;
  const aspectRatio = model.aspectRatio || (isLandscape ? 3508 / 2480 : 2480 / 3508);
  const targetHeight = Math.round(targetWidth / aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Draw Background
  const bg = model.background;
  if (bg.type === 'dark') {
    ctx.fillStyle = bg.color || '#090d16';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    if (bg.gradient) {
      const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  } else if (bg.type === 'parchment') {
    ctx.fillStyle = bg.color || '#fdfbf7';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    const grad = ctx.createRadialGradient(
      targetWidth / 2,
      targetHeight / 2,
      targetWidth * 0.2,
      targetWidth / 2,
      targetHeight / 2,
      targetWidth * 0.7
    );
    grad.addColorStop(0, '#fffefb');
    grad.addColorStop(1, '#f7f2e7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bg.type === 'gradient' || bg.gradient) {
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    grad.addColorStop(0, bg.color || '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bg.imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = bg.imageUrl!;
      });
      if (img.width > 0) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.fillStyle = bg.color || '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
    } catch {
      ctx.fillStyle = bg.color || '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  } else {
    ctx.fillStyle = bg.color || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Draw Certificate Border
  if (model.border && model.border.enabled && model.border.style !== 'none') {
    const insetPxX = (targetWidth * (model.border.inset || 4)) / 100;
    const insetPxY = (targetHeight * (model.border.inset || 4)) / 100;
    const bx = insetPxX;
    const by = insetPxY;
    const bw = targetWidth - insetPxX * 2;
    const bh = targetHeight - insetPxY * 2;
    const bColor = model.border.color || '#d97706';
    const bWidth = (model.border.width || 3) * (targetWidth / 1000);
    const radius = model.border.borderRadius ? (model.border.borderRadius * (targetWidth / 1000)) : 12;

    ctx.save();
    ctx.strokeStyle = bColor;
    ctx.lineWidth = bWidth;

    if (model.border.style === 'curvy_rounded') {
      roundRect(ctx, bx, by, bw, bh, Math.max(radius, 28));
      ctx.stroke();
    } else if (model.border.style === 'dashed_frame') {
      ctx.setLineDash([bWidth * 3, bWidth * 2]);
      roundRect(ctx, bx, by, bw, bh, 8);
      ctx.stroke();
    } else if (model.border.style === 'double_gold' || model.border.style === 'ornate') {
      roundRect(ctx, bx, by, bw, bh, 8);
      ctx.stroke();
      const innerInset = 12 * (targetWidth / 1000);
      ctx.lineWidth = Math.max(1, bWidth * 0.4);
      ctx.strokeStyle = bColor + 'aa';
      roundRect(ctx, bx + innerInset, by + innerInset, bw - innerInset * 2, bh - innerInset * 2, 6);
      ctx.stroke();
    } else if (model.border.style === 'geometric') {
      roundRect(ctx, bx, by, bw, bh, 0);
      ctx.stroke();
      const cl = 25 * (targetWidth / 1000);
      ctx.lineWidth = bWidth * 1.5;
      ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + cl, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + cl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw + 5, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw, by - 5); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 5, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw + 5, by + bh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw, by + bh - cl); ctx.lineTo(bx + bw, by + bh + 5); ctx.stroke();
    } else {
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Draw All Elements
  for (const el of model.elements) {
    if (el.hidden) continue;

    const elX = (targetWidth * el.x) / 100;
    const elY = (targetHeight * el.y) / 100;
    const elW = (targetWidth * el.width) / 100;
    const elH = (targetHeight * el.height) / 100;

    ctx.save();
    ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;

    if (el.rotation) {
      const centerX = elX + elW / 2;
      const centerY = elY + elH / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Always clip to the element bounding box so nothing overflows
    ctx.beginPath();
    ctx.rect(elX, elY, elW, elH);
    ctx.clip();

    if (
      el.type === 'title' ||
      el.type === 'recipient' ||
      el.type === 'body' ||
      el.type === 'text' ||
      el.type === 'org_name' ||
      el.type === 'event_name'
    ) {
      const scale = targetWidth / 1000;
      let rawFontSize = el.fontSize;
      if (!rawFontSize) {
        if (el.type === 'recipient') rawFontSize = 36;
        else if (el.type === 'title') rawFontSize = 28;
        else if (el.type === 'org_name') rawFontSize = 14;
        else if (el.type === 'body') rawFontSize = 13;
        else rawFontSize = 12;
      }

      // Proportional scale for 2400px A4 canvas
      let scaledFontSize = Math.round(rawFontSize * scale);
      if (el.type === 'recipient') {
        scaledFontSize = Math.max(scaledFontSize, Math.round(34 * scale)); // ~82px-96px
      } else if (el.type === 'title') {
        scaledFontSize = Math.max(scaledFontSize, Math.round(26 * scale)); // ~64px-76px
      } else if (el.type === 'body') {
        scaledFontSize = Math.max(scaledFontSize, Math.round(12 * scale)); // ~28px-34px
      } else if (el.type === 'org_name') {
        scaledFontSize = Math.max(scaledFontSize, Math.round(12 * scale)); // ~28px-34px
      }

      // Font Family Mapping supporting all 10+ professional typefaces
      let fontFam = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      if (el.fontFamily === 'playfair' || el.fontFamily === 'serif') {
        fontFam = '"Playfair Display", Georgia, "Times New Roman", serif';
      } else if (el.fontFamily === 'cinzel' || el.fontFamily === 'display') {
        fontFam = '"Cinzel", "Times New Roman", serif';
      } else if (el.fontFamily === 'cormorant') {
        fontFam = '"Cormorant Garamond", Georgia, serif';
      } else if (el.fontFamily === 'times_new_roman') {
        fontFam = '"Times New Roman", Times, Georgia, serif';
      } else if (el.fontFamily === 'montserrat') {
        fontFam = '"Montserrat", -apple-system, sans-serif';
      } else if (el.fontFamily === 'poppins') {
        fontFam = '"Poppins", -apple-system, sans-serif';
      } else if (el.fontFamily === 'outfit') {
        fontFam = '"Outfit", -apple-system, sans-serif';
      } else if (el.fontFamily === 'space_grotesk') {
        fontFam = '"Space Grotesk", monospace, sans-serif';
      } else if (el.fontFamily === 'plus_jakarta') {
        fontFam = '"Plus Jakarta Sans", sans-serif';
      } else if (el.fontFamily === 'jetbrains_mono' || el.fontFamily === 'mono') {
        fontFam = '"JetBrains Mono", Menlo, Consolas, monospace';
      }

      // Standard CSS Font-Weight keywords/values accepted by HTML5 Canvas
      const weight =
        el.fontWeight === 'extrabold'
          ? '800'
          : el.fontWeight === 'bold'
            ? '700'
            : el.fontWeight === 'semibold'
              ? '600'
              : el.fontWeight === 'medium'
                ? '500'
                : el.type === 'recipient' || el.type === 'title'
                  ? '700'
                  : 'normal';

      const italic = el.fontStyle === 'italic' ? 'italic ' : '';

      ctx.font = `${italic}${weight} ${scaledFontSize}px ${fontFam}`;
      ctx.fillStyle = el.color || '#0f172a';

      const text = interpolate(el.content, variables);
      const align = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left';
      const textX = align === 'center' ? elX + elW / 2 : align === 'right' ? elX + elW : elX;
      const textY = elY + elH / 2;

      if (el.type === 'body' || (el.type === 'text' && text.length > 40)) {
        // Multi-line word-wrapped rendering bounded by element width
        const lineHeight = Math.round(scaledFontSize * (el.lineHeight || 1.5));
        drawWrappedText(ctx, text, textX, textY, elW, lineHeight, align);
      } else {
        // Check if single line fits, otherwise wrap
        const measured = ctx.measureText(text);
        if (measured.width > elW && text.includes(' ')) {
          const lineHeight = Math.round(scaledFontSize * 1.3);
          drawWrappedText(ctx, text, textX, textY, elW, lineHeight, align);
        } else {
          ctx.textAlign = align;
          ctx.textBaseline = 'middle';
          ctx.fillText(text, textX, textY);
        }
      }
    } else if (el.type === 'signatory') {
      const scale = targetWidth / 1000;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // If a signature image was uploaded, draw it
      if (el.signatureUrl) {
        try {
          const sigImg = new Image();
          sigImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            sigImg.onload = () => resolve();
            sigImg.onerror = () => resolve();
            sigImg.src = el.signatureUrl!;
          });
          if (sigImg.width > 0) {
            const sigH = elH * 0.38;
            const sigW = Math.min(elW, sigImg.width * (sigH / sigImg.height));
            ctx.drawImage(sigImg, elX, elY, sigW, sigH);
          } else {
            // Fallback italic text
            ctx.font = `italic 400 ${Math.round(20 * scale)}px "Brush Script MT", cursive, Georgia, serif`;
            ctx.fillStyle = el.color || '#b45309';
            ctx.fillText(el.signatoryName || '', elX, elY + elH * 0.25);
          }
        } catch {
          ctx.font = `italic 400 ${Math.round(20 * scale)}px "Brush Script MT", cursive, Georgia, serif`;
          ctx.fillStyle = el.color || '#b45309';
          ctx.fillText(el.signatoryName || '', elX, elY + elH * 0.25);
        }
      } else {
        // Cursive signature text
        ctx.font = `italic 400 ${Math.round(20 * scale)}px "Brush Script MT", "Caveat", "Dancing Script", cursive, Georgia, serif`;
        ctx.fillStyle = el.color || '#b45309';
        ctx.fillText(el.signatoryName || 'Executive convener', elX, elY + elH * 0.30);
      }

      if (el.showSignatureLine) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.moveTo(elX, elY + elH * 0.50);
        ctx.lineTo(elX + elW * 0.9, elY + elH * 0.50);
        ctx.stroke();
      }

      // Printed Name
      ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.fillText(el.signatoryName || '', elX, elY + elH * 0.68);

      // Printed Title
      ctx.font = `normal ${Math.round(10 * scale)}px sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(el.signatoryTitle || '', elX, elY + elH * 0.84);
    } else if (el.type === 'seal') {
      const cx = elX + elW / 2;
      const cy = elY + elH / 2;
      const r = Math.min(elW, elH) / 2;
      const color = el.sealColor || '#d97706';
      const scale = targetWidth / 1000;

      // Outer decorative sunburst/notched rim
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = color + '1a';
      ctx.fill();
      ctx.lineWidth = 3.5 * scale;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Inner circular bead line
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * scale;
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.strokeStyle = color + 'cc';
      ctx.stroke();
      ctx.setLineDash([]);

      // Center disc
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2);
      ctx.fillStyle = color + '14';
      ctx.fill();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Emblem text
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.round(10 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OFFICIAL', cx, cy - r * 0.22);
      ctx.fillText('SEAL', cx, cy + r * 0.22);

      // Star emblem in center
      ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
      ctx.fillText('★', cx, cy);

      ctx.restore();
    } else if (el.type === 'qr') {
      // High-resolution scannable QR Code
      const qrData = variables.reference
        ? `https://msbackstage.internal/verify/${variables.reference}`
        : `https://msbackstage.internal/verify/CERT-SAMPLE-${Math.abs(elX | 0)}`;

      // Card container
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, elX, elY, elW, elH, 12);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      try {
        const qr = QRCode.create(qrData, { errorCorrectionLevel: 'M' });
        const moduleCount = qr.modules.size;
        const qrSide = Math.min(elW, elH) * 0.72;
        const qx = elX + (elW - qrSide) / 2;
        const qy = elY + (elH - qrSide) / 2 - (elH * 0.08);
        const cellSize = qrSide / moduleCount;

        ctx.fillStyle = '#0f172a';
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.modules.get(row, col)) {
              ctx.fillRect(
                Math.round(qx + col * cellSize),
                Math.round(qy + row * cellSize),
                Math.ceil(cellSize),
                Math.ceil(cellSize)
              );
            }
          }
        }

        // Verification caption below QR
        const scale = targetWidth / 1000;
        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${Math.round(8 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCAN TO VERIFY', elX + elW / 2, elY + elH - (elH * 0.12));
      } catch {
        // Fallback clean pattern if QR generator fails
        ctx.fillStyle = '#0f172a';
        const qPad = elW * 0.15;
        const qInner = elW - qPad * 2;
        ctx.fillRect(elX + qPad, elY + qPad, qInner * 0.35, qInner * 0.35);
        ctx.fillRect(elX + elW - qPad - qInner * 0.35, elY + qPad, qInner * 0.35, qInner * 0.35);
        ctx.fillRect(elX + qPad, elY + elH - qPad - qInner * 0.35, qInner * 0.35, qInner * 0.35);
      }
    } else if (el.type === 'logo' && el.src) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = el.src!;
        });
        if (img.width > 0) {
          // Draw image preserving aspect ratio inside elW x elH
          const hRatio = elW / img.width;
          const vRatio = elH / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const drawW = img.width * ratio;
          const drawH = img.height * ratio;
          const drawX = elX + (elW - drawW) / 2;
          const drawY = elY + (elH - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
      } catch {
        // Fallback
      }
    } else if (el.type === 'line') {
      ctx.fillStyle = el.fillColor || '#d97706';
      ctx.fillRect(elX, elY, elW, elH);
    } else if (el.type === 'shape') {
      if (el.fillColor) {
        ctx.fillStyle = el.fillColor;
        roundRect(ctx, elX, elY, elW, elH, el.borderRadius ? el.borderRadius * (targetWidth / 1000) : 8);
        ctx.fill();
      }
      if (el.borderColor && el.borderWidth) {
        ctx.strokeStyle = el.borderColor;
        ctx.lineWidth = el.borderWidth * (targetWidth / 1000);
        roundRect(ctx, elX, elY, elW, elH, el.borderRadius ? el.borderRadius * (targetWidth / 1000) : 8);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Generates an exact physical A4 PDF (%PDF-1.4) containing the 300 DPI certificate.
 * MediaBox is set to exact ISO A4 dimensions (297 x 210 mm = 841.89 x 595.28 pt).
 */
export async function createPdfFromCanvas(
  canvas: HTMLCanvasElement,
  isLandscape: boolean = true
): Promise<Blob> {
  const ptWidth = isLandscape ? 841.89 : 595.28;
  const ptHeight = isLandscape ? 595.28 : 841.89;

  // Convert canvas to JPEG buffer with high visual quality (0.96)
  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.96)
  );
  if (!jpegBlob) throw new Error('Could not convert canvas to image');

  const jpegArrayBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegArrayBuffer);

  const objects: Uint8Array[] = [];
  const offsets: number[] = [];
  const encoder = new TextEncoder();

  function addTextObj(str: string) {
    objects.push(encoder.encode(str));
  }

  // 1: Catalog
  addTextObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // 2: Pages
  addTextObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  // 3: Page with exact A4 MediaBox
  addTextObj(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth.toFixed(2)} ${ptHeight.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`
  );
  // 4: Content stream filling the entire page
  const contentStream = `q ${ptWidth.toFixed(2)} 0 0 ${ptHeight.toFixed(2)} 0 0 cm /Im1 Do Q\n`;
  addTextObj(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // 5: Image XObject with JPEG stream
  const imgHeader = encoder.encode(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  const imgFooter = encoder.encode('\nendstream\nendobj\n');

  const fullImgObj = new Uint8Array(imgHeader.length + jpegBytes.length + imgFooter.length);
  fullImgObj.set(imgHeader, 0);
  fullImgObj.set(jpegBytes, imgHeader.length);
  fullImgObj.set(imgFooter, imgHeader.length + jpegBytes.length);
  objects.push(fullImgObj);

  // Assemble PDF file
  const header = encoder.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  let pos = header.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pos);
    pos += objects[i].length;
  }

  const startXref = pos;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  const xrefAndTrailer = encoder.encode(xref + trailer);

  const totalLength = pos + xrefAndTrailer.length;
  const pdfBytes = new Uint8Array(totalLength);

  let offset = 0;
  pdfBytes.set(header, offset);
  offset += header.length;

  for (const obj of objects) {
    pdfBytes.set(obj, offset);
    offset += obj.length;
  }
  pdfBytes.set(xrefAndTrailer, offset);

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Downloads the certificate as a 300 DPI high-resolution lossless PNG.
 * For A4 Landscape: 3508 x 2480 pixels.
 * For A4 Portrait: 2480 x 3508 pixels.
 */
export async function downloadCertificateAsPng(
  model: CertificateCanvasModel,
  variables: Record<string, string> = {},
  filename: string = 'certificate.png'
): Promise<void> {
  const isLandscape = model.format !== 'a4_portrait';
  const targetWidth = isLandscape ? 3508 : 2480;
  const canvas = await renderCertificateToCanvas(model, variables, targetWidth);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Downloads the certificate directly as a physical A4 PDF document (297 x 210 mm).
 * Uses exact standard page media dimensions with 300 DPI crisp graphic fidelity.
 */
export async function downloadCertificateAsPdf(
  model: CertificateCanvasModel,
  variables: Record<string, string> = {},
  filename: string = 'certificate.pdf'
): Promise<void> {
  const isLandscape = model.format !== 'a4_portrait';
  const targetWidth = isLandscape ? 3508 : 2480;
  const canvas = await renderCertificateToCanvas(model, variables, targetWidth);
  const pdfBlob = await createPdfFromCanvas(canvas, isLandscape);

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

