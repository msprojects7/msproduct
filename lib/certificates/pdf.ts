/**
 * MS Backstage — Pure Vector Digital Certificate PDF Generator (%PDF-1.4)
 *
 * Generates official landscape certificates (A4: 842 x 595 pt) with:
 * - Double ornamental vector borders (Navy & Gold)
 * - Event branding & Organization header
 * - Dynamic Title and Recipient typography
 * - Formatted verification statement
 * - Signatory block with title and date
 * - Vector QR code for instant tamper-proof verification
 * - Unique Certificate Reference Number
 */

import QRCode from 'qrcode';

export interface CertificatePdfOptions {
  certificateReference: string;
  eventName: string;
  organizationName: string;
  recipientName: string;
  title: string;
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  issuedDate: string;
  verificationUrl: string;
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Builds vector path operations for QR code modules.
 */
function buildQrVectorStream(qrText: string, startX: number, startY: number, boxSize: number): string {
  try {
    const qr = QRCode.create(qrText, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const cellSize = boxSize / moduleCount;

    let ops = 'q 0.059 0.090 0.165 rg\n'; // Slate #0f172a
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = (startX + c * cellSize).toFixed(2);
          const y = (startY + (moduleCount - 1 - r) * cellSize).toFixed(2);
          const s = cellSize.toFixed(2);
          ops += `${x} ${y} ${s} ${s} re f\n`;
        }
      }
    }
    ops += 'Q\n';
    return ops;
  } catch {
    return '';
  }
}

export function generateCertificatePdf(options: CertificatePdfOptions): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length;
  }

  const catalogObjNum = 1;
  const outlinesObjNum = 2;
  const pagesObjNum = 3;
  const fontNormalObjNum = 4;
  const fontBoldObjNum = 5;

  objects.push(`<< /Type /Catalog /Pages ${pagesObjNum} 0 R /Outlines ${outlinesObjNum} 0 R >>`);
  objects.push(`<< /Type /Outlines /Count 0 >>`);
  objects.push(''); // placeholder for Pages (obj 3)
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // Dimensions: Standard A4 Landscape (842 x 595 points)
  const pageWidth = 842;
  const pageHeight = 595;

  let stream = '';

  // 1. Background fill: Soft ivory / white #fcfdfa
  stream += `q 0.988 0.992 0.980 rg 0 0 ${pageWidth} ${pageHeight} re f Q\n`;

  // 2. Ornamental Outer Border (Deep Navy #0f172a, line width 3)
  stream += `q 0.059 0.090 0.165 RG 3 w 24 24 ${pageWidth - 48} ${pageHeight - 48} re s Q\n`;

  // 3. Inner Decorative Accent Border (Warm Gold #d97706, line width 1)
  stream += `q 0.851 0.467 0.024 RG 1 w 30 30 ${pageWidth - 60} ${pageHeight - 60} re s Q\n`;

  // 4. Subtle Corner Rosettes/Squares
  const corners = [
    [30, 30],
    [pageWidth - 36, 30],
    [30, pageHeight - 36],
    [pageWidth - 36, pageHeight - 36],
  ];
  stream += 'q 0.851 0.467 0.024 rg\n';
  for (const [cx, cy] of corners) {
    stream += `${cx} ${cy} 6 6 re f\n`;
  }
  stream += 'Q\n';

  // 5. Header: Organization & Event Title
  stream += `BT /F2 13 Tf 0.35 0.40 0.50 rg 1 0 0 1 50 520 Tm (${escapePdfText(options.organizationName.toUpperCase())}) Tj ET\n`;
  stream += `BT /F1 11 Tf 0.45 0.50 0.60 rg 1 0 0 1 50 502 Tm (${escapePdfText(options.eventName)}) Tj ET\n`;

  // Decorative top divider line
  stream += `q 0.88 0.90 0.94 RG 0.5 w 50 490 ${pageWidth - 100} 0 re s Q\n`;

  // 6. Main Certificate Title (Centered visually)
  const certTitle = (options.title || 'CERTIFICATE OF ATTENDANCE').toUpperCase();
  stream += `BT /F2 26 Tf 0.059 0.090 0.165 rg 1 0 0 1 50 435 Tm (${escapePdfText(certTitle)}) Tj ET\n`;

  // 7. Subtitle / Presentation clause
  stream += `BT /F1 13 Tf 0.40 0.45 0.55 rg 1 0 0 1 50 395 Tm (This is proudly presented to) Tj ET\n`;

  // 8. Recipient Name (Large, prominent Navy font)
  stream += `BT /F2 28 Tf 0.118 0.161 0.231 rg 1 0 0 1 50 350 Tm (${escapePdfText(options.recipientName)}) Tj ET\n`;

  // Recipient underline accent
  stream += `q 0.851 0.467 0.024 RG 2 w 50 338 350 0 re s Q\n`;

  // 9. Body Text (Customizable or default participating description)
  const interpolatedBody = options.bodyText.replace(/{{name}}/gi, options.recipientName);
  stream += `BT /F1 12 Tf 0.25 0.30 0.38 rg 1 0 0 1 50 305 Tm (${escapePdfText(interpolatedBody)}) Tj ET\n`;

  // 10. Left Signatory Block
  stream += `q 0.2 0.25 0.35 RG 1 w 50 145 220 0 re s Q\n`;
  stream += `BT /F2 12 Tf 0.08 0.12 0.20 rg 1 0 0 1 50 128 Tm (${escapePdfText(options.signatoryName)}) Tj ET\n`;
  stream += `BT /F1 10 Tf 0.45 0.50 0.60 rg 1 0 0 1 50 112 Tm (${escapePdfText(options.signatoryTitle)}) Tj ET\n`;
  stream += `BT /F1 9 Tf 0.55 0.60 0.68 rg 1 0 0 1 50 96 Tm (Date of Issue: ${escapePdfText(options.issuedDate)}) Tj ET\n`;

  // 11. Right Digital Verification & QR Block
  const qrBoxSize = 75;
  const qrStartX = pageWidth - 50 - qrBoxSize;
  const qrStartY = 95;

  const qrStream = buildQrVectorStream(options.verificationUrl, qrStartX, qrStartY, qrBoxSize);
  stream += qrStream;

  stream += `BT /F2 9 Tf 0.08 0.12 0.20 rg 1 0 0 1 ${qrStartX - 190} 145 Tm (Digital Verification Reference:) Tj ET\n`;
  stream += `BT /F2 11 Tf 0.851 0.467 0.024 rg 1 0 0 1 ${qrStartX - 190} 130 Tm (${escapePdfText(options.certificateReference)}) Tj ET\n`;
  stream += `BT /F1 8 Tf 0.45 0.50 0.60 rg 1 0 0 1 ${qrStartX - 190} 114 Tm (Scan QR or navigate to verification portal) Tj ET\n`;
  stream += `BT /F1 8 Tf 0.45 0.50 0.60 rg 1 0 0 1 ${qrStartX - 190} 100 Tm (to confirm authenticity on MS Backstage.) Tj ET\n`;

  // 12. Bottom Security Disclaimer
  stream += `BT /F1 8 Tf 0.60 0.65 0.72 rg 1 0 0 1 50 45 Tm (This tamper-proof digital credential is cryptographically logged and authenticated by MS Backstage.) Tj ET\n`;

  // Compress stream & construct PDF
  const streamLength = Buffer.byteLength(stream, 'utf-8');
  const pageStreamObjNum = addObject(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);

  const pageObjNum = addObject(
    `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${pageStreamObjNum} 0 R /Resources << /Font << /F1 ${fontNormalObjNum} 0 R /F2 ${fontBoldObjNum} 0 R >> >> >>`
  );

  objects[pagesObjNum - 1] = `<< /Type /Pages /Kids [${pageObjNum} 0 R] /Count 1 >>`;

  let pdfContent = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfContent.length);
    pdfContent += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdfContent.length;
  pdfContent += `xref\n0 ${objects.length + 1}\n`;
  pdfContent += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdfContent += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdfContent, 'utf-8');
}
