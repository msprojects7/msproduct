/**
 * MS Backstage — Pure TypeScript PDF Report Generator
 *
 * Generates standards-compliant, binary PDF documents (%PDF-1.4) without external dependencies.
 * Includes MS Backstage branded headers, table layout, typography, pagination, and timestamps.
 */

export interface PdfReportOptions {
  eventName: string;
  organizationName: string;
  generatedAt: string;
  filterSummary: string;
  headers: string[];
  rows: string[][];
}

/**
 * Escapes characters for PDF literal strings
 */
function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generatePdfReport(options: PdfReportOptions): Buffer {
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length; // 1-indexed object number
  }

  // 1. Catalog
  const catalogObjNum = 1;
  // 2. Outlines
  const outlinesObjNum = 2;
  // 3. Pages container
  const pagesObjNum = 3;
  // 4. Font Helvetica
  const fontNormalObjNum = 4;
  // 5. Font Helvetica-Bold
  const fontBoldObjNum = 5;

  objects.push(`<< /Type /Catalog /Pages ${pagesObjNum} 0 R /Outlines ${outlinesObjNum} 0 R >>`);
  objects.push(`<< /Type /Outlines /Count 0 >>`);

  // Placeholders for Pages, will update with kids
  const pagesPlaceholderIndex = objects.length; // index 2 (for obj 3)
  objects.push(''); // placeholder for pages container

  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // Page dimensions: A4 Landscape: 842 x 595 points
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 770 pt

  // Calculate items per page
  const rowsPerPage = 18;
  const totalPages = Math.max(1, Math.ceil(options.rows.length / rowsPerPage));
  const pageObjNums: number[] = [];

  // Column definitions (relative widths summing to contentWidth)
  // Headers: ['Reg No', 'Name', 'Category', 'Food', 'Payment', 'Type', 'Status', 'Date']
  const colWidths = [100, 150, 90, 80, 70, 90, 90, 100];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const startRow = pageIdx * rowsPerPage;
    const pageRows = options.rows.slice(startRow, startRow + rowsPerPage);

    let stream = '';

    // Header Background banner: Dark Slate #0f172a
    stream += `q 0.059 0.090 0.165 rg 0 ${pageHeight - 60} ${pageWidth} 60 re f Q\n`;

    // Header Text
    stream += `BT /F2 16 Tf 1 1 1 rg ${margin} ${pageHeight - 34} Td (MS BACKSTAGE - EVENT REPORT) Tj ET\n`;
    stream += `BT /F1 9 Tf 0.584 0.639 0.722 rg ${margin} ${pageHeight - 48} Td (${escapePdfText(options.organizationName.toUpperCase())} | ${escapePdfText(options.eventName)}) Tj ET\n`;

    // Metadata bar below banner
    stream += `BT /F1 8 Tf 0.28 0.33 0.41 rg ${margin} ${pageHeight - 74} Td (Generated: ${escapePdfText(options.generatedAt)} | Filters: ${escapePdfText(options.filterSummary)}) Tj ET\n`;

    // Table Header Row Background: Dark Navy #1e293b
    const tableTop = pageHeight - 96;
    stream += `q 0.118 0.161 0.231 rg ${margin} ${tableTop} ${contentWidth} 20 re f Q\n`;

    // Table Header Text
    let colX = margin;
    for (let c = 0; c < options.headers.length; c++) {
      const hText = escapePdfText(options.headers[c]);
      stream += `BT /F2 8 Tf 1 1 1 rg ${colX + 4} ${tableTop + 6} Td (${hText}) Tj ET\n`;
      colX += colWidths[c] || 80;
    }

    // Table Rows
    let rowY = tableTop - 20;
    for (let r = 0; r < pageRows.length; r++) {
      const row = pageRows[r];
      // Zebra striping
      if (r % 2 === 1) {
        stream += `q 0.957 0.965 0.980 rg ${margin} ${rowY} ${contentWidth} 20 re f Q\n`;
      }
      // Row border bottom
      stream += `q 0.89 0.91 0.94 RG 0.5 w ${margin} ${rowY} m ${margin + contentWidth} ${rowY} l S Q\n`;

      colX = margin;
      for (let c = 0; c < row.length; c++) {
        let cellText = escapePdfText(row[c] || '');
        // Truncate long strings for cell width
        if (cellText.length > 26) cellText = cellText.substring(0, 24) + '..';

        stream += `BT /F1 8 Tf 0.09 0.13 0.20 rg ${colX + 4} ${rowY + 6} Td (${cellText}) Tj ET\n`;
        colX += colWidths[c] || 80;
      }
      rowY -= 20;
    }

    // Footer
    stream += `q 0.89 0.91 0.94 RG 0.5 w ${margin} 30 m ${margin + contentWidth} 30 l S Q\n`;
    stream += `BT /F1 8 Tf 0.584 0.639 0.722 rg ${margin} 18 Td (Confidential Event Records | MS Backstage SaaS Platform) Tj ET\n`;
    const pageStr = `Page ${pageIdx + 1} of ${totalPages}`;
    stream += `BT /F1 8 Tf 0.584 0.639 0.722 rg ${pageWidth - margin - 60} 18 Td (${pageStr}) Tj ET\n`;

    // Stream content object
    const streamBuffer = Buffer.from(stream, 'utf-8');
    const contentObjNum = addObject(`<< /Length ${streamBuffer.length} >>\nstream\n${stream}\nendstream`);

    // Page object
    const pageObjNum = addObject(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${fontNormalObjNum} 0 R /F2 ${fontBoldObjNum} 0 R >> >> >>`);
    pageObjNums.push(pageObjNum);
  }

  // Update Pages container with kids
  const kidsStr = pageObjNums.map((num) => `${num} 0 R`).join(' ');
  objects[pagesPlaceholderIndex] = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjNums.length} >>`;

  // Build binary PDF representation
  const header = '%PDF-1.4\n';
  let body = header;
  const xrefOffsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(body.length);
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offset = xrefOffsets[i].toString().padStart(10, '0');
    body += `${offset} 00000 n \n`;
  }

  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(body, 'binary');
}
