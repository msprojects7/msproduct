/**
 * MS Backstage — Pure Vector Digital Ticket PDF Generator (%PDF-1.4)
 *
 * Generates high-fidelity, vector-crisp digital tickets without native C++ dependencies.
 * Features:
 * - Direct vector-rendered QR code (crystal clear scanning at any resolution)
 * - Event branding & organizer details
 * - Attendee name, registration number, category badge
 * - Venue and schedule instructions
 * - Secure ticket verification reference
 */

import QRCode from 'qrcode';

export interface TicketPdfOptions {
  eventName: string;
  organizationName: string;
  attendeeName: string;
  registrationNumber: string;
  category: string;
  ticketName: string;
  venue?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  qrToken: string;
  orderNumber: string;
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Builds vector path operations for QR code modules.
 * Standard PDF coordinate space: (0,0) is bottom-left.
 */
function buildQrVectorStream(qrText: string, startX: number, startY: number, boxSize: number): string {
  try {
    const qr = QRCode.create(qrText, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const cellSize = boxSize / moduleCount;

    let ops = 'q 0.059 0.090 0.165 rg\n'; // Dark Slate #0f172a
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        // QRCode module check (1 or true = black module)
        if (qr.modules.get(r, c)) {
          const x = (startX + c * cellSize).toFixed(2);
          // In PDF, Y goes up from bottom
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

export function generateTicketPdf(options: TicketPdfOptions): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length;
  }

  // 1. Catalog
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

  // Dimensions: Standard A5 Portrait (420 x 595 points)
  const pageWidth = 420;
  const pageHeight = 595;
  const margin = 28;
  const contentWidth = pageWidth - margin * 2; // 364 pt

  let stream = '';

  // Background canvas fill: Warm light gray #f8fafc
  stream += `q 0.973 0.980 0.988 rg 0 0 ${pageWidth} ${pageHeight} re f Q\n`;

  // Top Branded Header (Dark Slate Navy #0f172a)
  const headerHeight = 110;
  const headerTop = pageHeight;
  stream += `q 0.059 0.090 0.165 rg 0 ${headerTop - headerHeight} ${pageWidth} ${headerHeight} re f Q\n`;

  // Accent Brand Strip (Royal Indigo #4f46e5)
  stream += `q 0.310 0.275 0.898 rg 0 ${headerTop - headerHeight - 4} ${pageWidth} 4 re f Q\n`;

  // Brand Name & Event Header Text
  stream += `BT /F2 10 Tf 0.584 0.639 0.722 rg ${margin} ${headerTop - 26} Td (${escapePdfText(options.organizationName.toUpperCase())} PRESENTS) Tj ET\n`;
  stream += `BT /F2 18 Tf 1 1 1 rg ${margin} ${headerTop - 50} Td (${escapePdfText(options.eventName.slice(0, 36))}) Tj ET\n`;
  if (options.venue || options.startDate) {
    const sub = [options.startDate, options.venue].filter(Boolean).join(' • ');
    stream += `BT /F1 9 Tf 0.79 0.82 0.89 rg ${margin} ${headerTop - 68} Td (${escapePdfText(sub.slice(0, 55))}) Tj ET\n`;
  }
  stream += `BT /F2 8 Tf 0.584 0.639 0.722 rg ${margin} ${headerTop - 88} Td (DIGITAL PASS & VERIFIED ADMISSION TICKET) Tj ET\n`;

  // Ticket Container Card: White #ffffff with border
  const cardTop = headerTop - headerHeight - 20;
  const cardHeight = 440;
  stream += `q 1 1 1 rg ${margin} ${cardTop - cardHeight} ${contentWidth} ${cardHeight} re f Q\n`;
  stream += `q 0.886 0.910 0.941 RG 1 w ${margin} ${cardTop - cardHeight} ${contentWidth} ${cardHeight} re s Q\n`;

  // Attendee Badge Section
  const attendeeY = cardTop - 36;
  stream += `BT /F1 8 Tf 0.392 0.455 0.545 rg ${margin + 16} ${attendeeY} Td (ATTENDEE NAME) Tj ET\n`;
  stream += `BT /F2 16 Tf 0.059 0.090 0.165 rg ${margin + 16} ${attendeeY - 18} Td (${escapePdfText(options.attendeeName)}) Tj ET\n`;

  // Registration Number & Category Pills
  const metaY = attendeeY - 48;
  // Category Pill Box: #eff6ff
  stream += `q 0.937 0.965 1 rg ${margin + 16} ${metaY - 4} 140 24 re f Q\n`;
  stream += `q 0.753 0.859 0.996 RG 0.5 w ${margin + 16} ${metaY - 4} 140 24 re s Q\n`;
  stream += `BT /F2 9 Tf 0.114 0.392 0.922 rg ${margin + 24} ${metaY + 4} Td (${escapePdfText(options.category.toUpperCase())}) Tj ET\n`;

  // Reg No Box: #f8fafc
  stream += `q 0.973 0.980 0.988 rg ${margin + 166} ${metaY - 4} 166 24 re f Q\n`;
  stream += `q 0.886 0.910 0.941 RG 0.5 w ${margin + 166} ${metaY - 4} 166 24 re s Q\n`;
  stream += `BT /F2 9 Tf 0.059 0.090 0.165 rg ${margin + 174} ${metaY + 4} Td (REG: ${escapePdfText(options.registrationNumber)}) Tj ET\n`;

  // Dotted Cut Line across Card
  const tearY = metaY - 24;
  stream += `q 0.75 0.78 0.82 RG [4 4] 0 d 1 w ${margin} ${tearY} m ${margin + contentWidth} ${tearY} l s Q\n`;

  // Ticket Class & Order Line
  const ticketInfoY = tearY - 24;
  stream += `BT /F1 8 Tf 0.392 0.455 0.545 rg ${margin + 16} ${ticketInfoY} Td (TICKET CLASS) Tj ET\n`;
  stream += `BT /F2 11 Tf 0.059 0.090 0.165 rg ${margin + 16} ${ticketInfoY - 14} Td (${escapePdfText(options.ticketName)}) Tj ET\n`;

  stream += `BT /F1 8 Tf 0.392 0.455 0.545 rg ${margin + 200} ${ticketInfoY} Td (ORDER REFERENCE) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.059 0.090 0.165 rg ${margin + 200} ${ticketInfoY - 14} Td (${escapePdfText(options.orderNumber)}) Tj ET\n`;

  // Centered Vector QR Code Box
  const qrBoxSize = 150;
  const qrX = margin + (contentWidth - qrBoxSize) / 2;
  const qrY = ticketInfoY - 32 - qrBoxSize;

  // QR Code Frame: Light gray container #f1f5f9
  stream += `q 0.945 0.961 0.976 rg ${qrX - 10} ${qrY - 10} ${qrBoxSize + 20} ${qrBoxSize + 20} re f Q\n`;
  stream += `q 0.886 0.910 0.941 RG 1 w ${qrX - 10} ${qrY - 10} ${qrBoxSize + 20} ${qrBoxSize + 20} re s Q\n`;

  // Vector QR Stream
  stream += buildQrVectorStream(options.qrToken, qrX, qrY, qrBoxSize);

  // QR Instruction Text
  const instrY = qrY - 28;
  stream += `BT /F2 9 Tf 0.059 0.090 0.165 rg ${margin + 40} ${instrY} Td (Scan at venue registration desk for immediate check-in) Tj ET\n`;
  stream += `BT /F1 7 Tf 0.584 0.639 0.722 rg ${margin + 60} ${instrY - 12} Td (Token: ${escapePdfText(options.qrToken.slice(0, 32))}...) Tj ET\n`;

  // Security Verification Footer inside Card
  const footY = cardTop - cardHeight + 14;
  stream += `BT /F1 7 Tf 0.584 0.639 0.722 rg ${margin + 16} ${footY} Td (Secured by MS Backstage Event Operating System • Non-Transferable) Tj ET\n`;

  // Page Object
  const streamLength = Buffer.byteLength(stream, 'utf-8');
  const streamObjNum = addObject(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);
  const pageObjNum = addObject(
    `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjNum} 0 R /Resources << /Font << /F1 ${fontNormalObjNum} 0 R /F2 ${fontBoldObjNum} 0 R >> >> >>`
  );

  // Update Pages Object (obj 3)
  objects[pagesObjNum - 1] = `<< /Type /Pages /Kids [${pageObjNum} 0 R] /Count 1 >>`;

  // Assemble PDF document
  let pdf = '%PDF-1.4\n';
  const xrefOffsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\n`;
  pdf += `startxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}
