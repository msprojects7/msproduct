import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { attendees } from '@/db/schema/index';
import { eq, and, gte, lte, or, ilike, desc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import * as XLSX from 'xlsx';
import { generatePdfReport } from '@/lib/reports/pdf';

export const dynamic = 'force-dynamic';

const MAX_EXPORT_LIMIT = 5000;

/**
 * Defends against CSV / Spreadsheet formula injection.
 * Any string value beginning with '=', '+', '-', '@', '\t', or '\r'
 * is prepended with a single quote "'" to ensure it is treated purely as text
 * by Microsoft Excel, LibreOffice Calc, and Google Sheets.
 */
function sanitizeSpreadsheetValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const trimmed = str.trimStart();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Escapes CSV field in accordance with RFC 4180.
 */
function escapeCsvCell(value: unknown): string {
  const sanitized = sanitizeSpreadsheetValue(value);
  if (
    sanitized.includes('"') ||
    sanitized.includes(',') ||
    sanitized.includes('\n') ||
    sanitized.includes('\r')
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/**
 * Parses and validates date range filter.
 */
function parseDateFilter(
  preset?: string | null,
  fromStr?: string | null,
  toStr?: string | null
): { fromDate?: Date; toDate?: Date; error?: string } {
  const now = new Date();

  if (preset === 'today') {
    const todayStr = now.toISOString().slice(0, 10);
    return {
      fromDate: new Date(`${todayStr}T00:00:00.000Z`),
      toDate: new Date(`${todayStr}T23:59:59.999Z`),
    };
  }

  if (preset === '7d') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      fromDate: new Date(`${sevenDaysAgo.toISOString().slice(0, 10)}T00:00:00.000Z`),
      toDate: new Date(`${now.toISOString().slice(0, 10)}T23:59:59.999Z`),
    };
  }

  if (preset === '30d') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      fromDate: new Date(`${thirtyDaysAgo.toISOString().slice(0, 10)}T00:00:00.000Z`),
      toDate: new Date(`${now.toISOString().slice(0, 10)}T23:59:59.999Z`),
    };
  }

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromStr) {
    const parsed = new Date(fromStr.includes('T') ? fromStr : `${fromStr}T00:00:00.000Z`);
    if (isNaN(parsed.getTime())) {
      return { error: 'Invalid "from" date format.' };
    }
    fromDate = parsed;
  }

  if (toStr) {
    const parsed = new Date(toStr.includes('T') ? toStr : `${toStr}T23:59:59.999Z`);
    if (isNaN(parsed.getTime())) {
      return { error: 'Invalid "to" date format.' };
    }
    toDate = parsed;
  }

  if (fromDate && toDate) {
    if (fromDate.getTime() > toDate.getTime()) {
      return { error: '"from" date must be earlier than or equal to "to" date.' };
    }
    const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > maxRangeMs) {
      return { error: 'Date range cannot exceed 366 days.' };
    }
  }

  return { fromDate, toDate };
}

/**
 * GET /api/events/[eventId]/reports/export
 *
 * Exports attendee report data in CSV or Excel (.xlsx) format.
 * Enforces 'event:export_attendees' permission.
 * Enforces PII redaction based on 'event:view_attendee_pii'.
 * Defends against formula injection in both formats.
 * Records 'attendees:exported' audit log.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:export_attendees');

    const canViewPii = context.hasPermission('event:view_attendee_pii');

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const preset = searchParams.get('preset') || 'all';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const category = searchParams.get('category')?.trim();
    const registrationType = searchParams.get('registrationType')?.trim();
    const attendanceStatus = searchParams.get('attendanceStatus')?.trim();
    const paymentStatus = searchParams.get('paymentStatus')?.trim();
    const search = searchParams.get('search')?.trim();
    const rawLimit = parseInt(searchParams.get('limit') || '5000', 10);
    const limit = Math.min(MAX_EXPORT_LIMIT, Math.max(1, isNaN(rawLimit) ? 5000 : rawLimit));

    // Validate format
    if (format !== 'csv' && format !== 'xlsx' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid export format. Supported formats: csv, xlsx, pdf', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    // Validate date range
    const dateRange = parseDateFilter(preset !== 'custom' ? preset : null, fromStr, toStr);
    if (dateRange.error) {
      return NextResponse.json(
        { error: dateRange.error, code: 'INVALID_DATE_RANGE' },
        { status: 400 }
      );
    }
    const { fromDate, toDate } = dateRange;

    // Build conditions strictly scoped to this event
    const conditions = [eq(attendees.eventId, context.event.id)];

    if (category && category !== 'all') {
      conditions.push(eq(attendees.category, category));
    }
    if (registrationType && registrationType !== 'all') {
      conditions.push(eq(attendees.registrationType, registrationType));
    }
    if (attendanceStatus && attendanceStatus !== 'all') {
      conditions.push(eq(attendees.attendanceStatus, attendanceStatus));
    }
    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push(eq(attendees.paymentStatus, paymentStatus));
    }
    if (fromDate) {
      conditions.push(gte(attendees.createdAt, fromDate));
    }
    if (toDate) {
      conditions.push(lte(attendees.createdAt, toDate));
    }
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(attendees.name, searchPattern),
          ilike(attendees.registrationNumber, searchPattern)
        )!
      );
    }

    // Fetch records (bounded query to prevent unbounded memory usage)
    const records = await db
      .select()
      .from(attendees)
      .where(and(...conditions))
      .orderBy(desc(attendees.createdAt))
      .limit(limit);

    // Record audit event for export activity
    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'attendees:exported',
      entityType: 'event',
      entityId: context.event.id,
      details: {
        format,
        rowCount: records.length,
        redactedPii: !canViewPii,
        filters: {
          preset,
          category: category || 'all',
          attendanceStatus: attendanceStatus || 'all',
          registrationType: registrationType || 'all',
          paymentStatus: paymentStatus || 'all',
          search: search || null,
        },
      },
    });

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const safeSlug = context.event.slug.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Build normalized rows with sanitized cells
    const exportRows = records.map((a) => ({
      'Registration Number': sanitizeSpreadsheetValue(a.registrationNumber),
      'Name': sanitizeSpreadsheetValue(a.name),
      'Category': sanitizeSpreadsheetValue(a.category),
      'Phone Number': canViewPii ? sanitizeSpreadsheetValue(a.phoneNumber || '') : '[REDACTED]',
      'Email': canViewPii ? sanitizeSpreadsheetValue(a.email || '') : '[REDACTED]',
      'Gender': canViewPii ? sanitizeSpreadsheetValue(a.gender || '') : '[REDACTED]',
      'Medical Council Number': canViewPii
        ? sanitizeSpreadsheetValue(a.medicalCouncilNumber || '')
        : '[REDACTED]',
      'Food Preference': sanitizeSpreadsheetValue(a.foodPreference),
      'Payment Status': sanitizeSpreadsheetValue(a.paymentStatus),
      'Registration Type': a.registrationType === 'spot' ? 'Spot' : 'Pre-Registered',
      'Attendance Status':
        a.attendanceStatus === 'checked_in'
          ? 'Checked In'
          : a.attendanceStatus === 'checked_out'
          ? 'Checked Out'
          : 'Not Checked In',
      'Registered Date (UTC)': a.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    }));

    if (format === 'csv') {
      const headers = [
        'Registration Number',
        'Name',
        'Category',
        'Phone Number',
        'Email',
        'Gender',
        'Medical Council Number',
        'Food Preference',
        'Payment Status',
        'Registration Type',
        'Attendance Status',
        'Registered Date (UTC)',
      ];

      const csvLines = [headers.join(',')];
      for (const row of exportRows) {
        const line = headers.map((h) => escapeCsvCell(row[h as keyof typeof row])).join(',');
        csvLines.push(line);
      }

      // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
      const csvBuffer = Buffer.from('\uFEFF' + csvLines.join('\r\n'), 'utf-8');
      const filename = `attendees-${safeSlug}-${timestampStr}.csv`;

      return new NextResponse(csvBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    if (format === 'pdf') {
      const pdfHeaders = ['Reg No', 'Name', 'Category', 'Food', 'Payment', 'Type', 'Status', 'Date'];
      const pdfRows = exportRows.map((r) => [
        r['Registration Number'],
        r['Name'],
        r['Category'],
        r['Food Preference'],
        r['Payment Status'],
        r['Registration Type'],
        r['Attendance Status'],
        r['Registered Date (UTC)'].slice(0, 10),
      ]);

      const filterSummary = `Category: ${category || 'All'} | Status: ${attendanceStatus || 'All'} | Preset: ${preset || 'All'}`;

      const pdfBuffer = generatePdfReport({
        eventName: context.event.name,
        organizationName: context.organization.name,
        generatedAt: new Date().toUTCString(),
        filterSummary,
        headers: pdfHeaders,
        rows: pdfRows,
      });

      const filename = `attendees-${safeSlug}-${timestampStr}.pdf`;
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Excel XLSX export
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [
      { wch: 22 }, // Reg No
      { wch: 26 }, // Name
      { wch: 18 }, // Category
      { wch: 16 }, // Phone
      { wch: 26 }, // Email
      { wch: 12 }, // Gender
      { wch: 22 }, // Medical Council
      { wch: 18 }, // Food
      { wch: 16 }, // Payment
      { wch: 18 }, // Reg Type
      { wch: 18 }, // Attendance
      { wch: 22 }, // Created At
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees Report');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `attendees-${safeSlug}-${timestampStr}.xlsx`;

    return new NextResponse(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while exporting data' },
      { status: 500 }
    );
  }
}
