import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import {
  attendees,
  scanEvents,
  badgePrintEvents,
  auditEvents,
} from '@/db/schema/index';
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Validates and converts date input to UTC Date boundaries.
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
    const fromStrLocal = sevenDaysAgo.toISOString().slice(0, 10);
    const toStrLocal = now.toISOString().slice(0, 10);
    return {
      fromDate: new Date(`${fromStrLocal}T00:00:00.000Z`),
      toDate: new Date(`${toStrLocal}T23:59:59.999Z`),
    };
  }

  if (preset === '30d') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromStrLocal = thirtyDaysAgo.toISOString().slice(0, 10);
    const toStrLocal = now.toISOString().slice(0, 10);
    return {
      fromDate: new Date(`${fromStrLocal}T00:00:00.000Z`),
      toDate: new Date(`${toStrLocal}T23:59:59.999Z`),
    };
  }

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromStr) {
    const parsed = new Date(fromStr.includes('T') ? fromStr : `${fromStr}T00:00:00.000Z`);
    if (isNaN(parsed.getTime())) {
      return { error: 'Invalid "from" date format. Expected YYYY-MM-DD or ISO 8601.' };
    }
    fromDate = parsed;
  }

  if (toStr) {
    const parsed = new Date(toStr.includes('T') ? toStr : `${toStr}T23:59:59.999Z`);
    if (isNaN(parsed.getTime())) {
      return { error: 'Invalid "to" date format. Expected YYYY-MM-DD or ISO 8601.' };
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
 * GET /api/events/[eventId]/reports
 *
 * Computes authoritative database-derived analytics, registration trends,
 * attendance rates, category distributions, and staff activity.
 * Requires 'event:view' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || 'all';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const category = searchParams.get('category')?.trim();
    const registrationType = searchParams.get('registrationType')?.trim();
    const attendanceStatus = searchParams.get('attendanceStatus')?.trim();
    const paymentStatus = searchParams.get('paymentStatus')?.trim();

    // Date range validation
    const dateRange = parseDateFilter(preset !== 'custom' ? preset : null, fromStr, toStr);
    if (dateRange.error) {
      return NextResponse.json(
        { error: dateRange.error, code: 'INVALID_DATE_RANGE' },
        { status: 400 }
      );
    }
    const { fromDate, toDate } = dateRange;

    // Filter conditions for attendees table
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

    const whereClause = and(...conditions);

    // 1. Overall Metrics from Attendees Table (Authoritative)
    const [summaryResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        checkedIn: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'checked_in')::int`,
        checkedOut: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'checked_out')::int`,
        notCheckedIn: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'not_checked_in')::int`,
        spotCount: sql<number>`count(*) filter (where ${attendees.registrationType} = 'spot')::int`,
        preRegCount: sql<number>`count(*) filter (where ${attendees.registrationType} = 'pre_registered')::int`,
        paidCount: sql<number>`count(*) filter (where ${attendees.paymentStatus} = 'Paid')::int`,
        pendingCount: sql<number>`count(*) filter (where ${attendees.paymentStatus} = 'Pending')::int`,
        complimentaryCount: sql<number>`count(*) filter (where ${attendees.paymentStatus} = 'Complimentary')::int`,
      })
      .from(attendees)
      .where(whereClause);

    const total = summaryResult?.total ?? 0;
    const checkedIn = summaryResult?.checkedIn ?? 0;
    const checkedOut = summaryResult?.checkedOut ?? 0;
    const notCheckedIn = summaryResult?.notCheckedIn ?? 0;
    const spotCount = summaryResult?.spotCount ?? 0;
    const preRegCount = summaryResult?.preRegCount ?? 0;
    const paidCount = summaryResult?.paidCount ?? 0;
    const pendingCount = summaryResult?.pendingCount ?? 0;
    const complimentaryCount = summaryResult?.complimentaryCount ?? 0;

    // Safe attendance rate calculation (zero division guard)
    const attendedCount = checkedIn + checkedOut;
    const attendanceRate = total > 0 ? Number(((attendedCount / total) * 100).toFixed(1)) : 0;

    // 2. Scan & Badge Print Totals (authoritative event tables)
    const scanConditions = [eq(scanEvents.eventId, context.event.id)];
    if (fromDate) scanConditions.push(gte(scanEvents.scannedAt, fromDate));
    if (toDate) scanConditions.push(lte(scanEvents.scannedAt, toDate));

    const [scanSummary] = await db
      .select({
        totalScans: sql<number>`count(*)::int`,
        checkInScans: sql<number>`count(*) filter (where ${scanEvents.action} = 'check_in')::int`,
        checkOutScans: sql<number>`count(*) filter (where ${scanEvents.action} = 'check_out')::int`,
      })
      .from(scanEvents)
      .where(and(...scanConditions));

    const [badgeSummary] = await db
      .select({
        totalPrints: sql<number>`count(*)::int`,
      })
      .from(badgePrintEvents)
      .where(eq(badgePrintEvents.eventId, context.event.id));

    // 3. Category Breakdown (Grouped)
    const categoryRows = await db
      .select({
        category: attendees.category,
        count: sql<number>`count(*)::int`,
        checkedIn: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'checked_in')::int`,
        checkedOut: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'checked_out')::int`,
      })
      .from(attendees)
      .where(whereClause)
      .groupBy(attendees.category)
      .orderBy(desc(sql`count(*)`));

    const categoryBreakdown = categoryRows.map((row) => ({
      category: row.category,
      count: row.count,
      checkedIn: row.checkedIn,
      checkedOut: row.checkedOut,
      percentage: total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
      attendanceRate:
        row.count > 0
          ? Number((((row.checkedIn + row.checkedOut) / row.count) * 100).toFixed(1))
          : 0,
    }));

    // 4. Registration Type Breakdown
    const registrationTypeBreakdown = [
      {
        type: 'pre_registered',
        label: 'Pre-Registered',
        count: preRegCount,
        percentage: total > 0 ? Number(((preRegCount / total) * 100).toFixed(1)) : 0,
      },
      {
        type: 'spot',
        label: 'Spot Registration',
        count: spotCount,
        percentage: total > 0 ? Number(((spotCount / total) * 100).toFixed(1)) : 0,
      },
    ];

    // 5. Payment Status Breakdown
    const paymentStatusBreakdown = [
      {
        status: 'Paid',
        count: paidCount,
        percentage: total > 0 ? Number(((paidCount / total) * 100).toFixed(1)) : 0,
      },
      {
        status: 'Pending',
        count: pendingCount,
        percentage: total > 0 ? Number(((pendingCount / total) * 100).toFixed(1)) : 0,
      },
      {
        status: 'Complimentary',
        count: complimentaryCount,
        percentage: total > 0 ? Number(((complimentaryCount / total) * 100).toFixed(1)) : 0,
      },
    ];

    // 6. Food Preference Breakdown
    const foodRows = await db
      .select({
        foodPreference: attendees.foodPreference,
        count: sql<number>`count(*)::int`,
      })
      .from(attendees)
      .where(whereClause)
      .groupBy(attendees.foodPreference)
      .orderBy(desc(sql`count(*)`));

    // 7. Daily Registration Trends (UTC dates)
    const dailyRegRows = await db
      .select({
        dateStr: sql<string>`to_char(${attendees.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(attendees)
      .where(whereClause)
      .groupBy(sql`to_char(${attendees.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`)
      .orderBy(asc(sql`to_char(${attendees.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`));

    // 8. Daily Check-in Scan Trends
    const dailyScanRows = await db
      .select({
        dateStr: sql<string>`to_char(${scanEvents.scannedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        checkIns: sql<number>`count(*) filter (where ${scanEvents.action} = 'check_in')::int`,
        checkOuts: sql<number>`count(*) filter (where ${scanEvents.action} = 'check_out')::int`,
      })
      .from(scanEvents)
      .where(and(...scanConditions))
      .groupBy(sql`to_char(${scanEvents.scannedAt} at time zone 'UTC', 'YYYY-MM-DD')`)
      .orderBy(asc(sql`to_char(${scanEvents.scannedAt} at time zone 'UTC', 'YYYY-MM-DD')`));

    // 9. Recent Staff Activity (Audit + Scans combined feed)
    // Only expose to users holding event:view permission
    const recentScans = await db
      .select({
        id: scanEvents.id,
        action: scanEvents.action,
        scannedAt: scanEvents.scannedAt,
        staffUserId: scanEvents.staffUserId,
        deviceInfo: scanEvents.deviceInfo,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
      })
      .from(scanEvents)
      .innerJoin(attendees, eq(scanEvents.attendeeId, attendees.id))
      .where(eq(scanEvents.eventId, context.event.id))
      .orderBy(desc(scanEvents.scannedAt))
      .limit(15);

    const recentAudits = await db
      .select({
        id: auditEvents.id,
        action: auditEvents.action,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        userId: auditEvents.userId,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(eq(auditEvents.eventId, context.event.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(15);

    return NextResponse.json({
      status: 'ok',
      timezoneConvention: 'UTC',
      event: {
        id: context.event.id,
        name: context.event.name,
        slug: context.event.slug,
      },
      filtersApplied: {
        preset,
        from: fromDate?.toISOString() || null,
        to: toDate?.toISOString() || null,
        category: category || 'all',
        registrationType: registrationType || 'all',
        attendanceStatus: attendanceStatus || 'all',
        paymentStatus: paymentStatus || 'all',
      },
      summary: {
        totalAttendees: total,
        checkedIn,
        checkedOut,
        notCheckedIn,
        attendanceRate,
        spotRegistrations: spotCount,
        preRegistrations: preRegCount,
        paidCount,
        pendingCount,
        complimentaryCount,
        totalScans: scanSummary?.totalScans ?? 0,
        checkInScans: scanSummary?.checkInScans ?? 0,
        checkOutScans: scanSummary?.checkOutScans ?? 0,
        badgesPrinted: badgeSummary?.totalPrints ?? 0,
      },
      categoryBreakdown,
      registrationTypeBreakdown,
      paymentStatusBreakdown,
      foodPreferenceBreakdown: foodRows,
      dailyRegistrationTrends: dailyRegRows.map((r) => ({
        date: r.dateStr,
        count: r.count,
      })),
      dailyAttendanceTrends: dailyScanRows.map((r) => ({
        date: r.dateStr,
        checkIns: r.checkIns,
        checkOuts: r.checkOuts,
      })),
      recentActivity: {
        scans: recentScans,
        audits: recentAudits,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating report' },
      { status: 500 }
    );
  }
}
