import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { attendees, badgePrintEvents } from '@/db/schema/index';
import { eq, and, or, ilike, desc, sql, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim(); // 'printed', 'unprinted'
    const category = searchParams.get('category')?.trim();

    // Query attendees with print counts
    const printCountsSubquery = db
      .select({
        attendeeId: badgePrintEvents.attendeeId,
        printCount: count(badgePrintEvents.id).as('print_count'),
        lastPrintedAt: sql<Date>`max(${badgePrintEvents.printedAt})`.as('last_printed_at'),
      })
      .from(badgePrintEvents)
      .where(eq(badgePrintEvents.eventId, context.event.id))
      .groupBy(badgePrintEvents.attendeeId)
      .as('pc');

    let conditions = eq(attendees.eventId, context.event.id);

    if (search) {
      conditions = and(
        conditions,
        or(
          ilike(attendees.name, `%${search}%`),
          ilike(attendees.registrationNumber, `%${search}%`),
          ilike(attendees.email, `%${search}%`)
        )
      )!;
    }

    if (category) {
      conditions = and(conditions, eq(attendees.category, category))!;
    }

    const rows = await db
      .select({
        id: attendees.id,
        name: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
        email: attendees.email,
        foodPreference: attendees.foodPreference,
        attendanceStatus: attendees.attendanceStatus,
        paymentStatus: attendees.paymentStatus,
        qrToken: attendees.qrToken,
        createdAt: attendees.createdAt,
        printCount: sql<number>`coalesce(${printCountsSubquery.printCount}, 0)`,
        lastPrintedAt: printCountsSubquery.lastPrintedAt,
      })
      .from(attendees)
      .leftJoin(printCountsSubquery, eq(attendees.id, printCountsSubquery.attendeeId))
      .where(conditions)
      .orderBy(desc(attendees.createdAt))
      .limit(100);

    let filtered = rows;
    if (status === 'printed') {
      filtered = rows.filter((r) => Number(r.printCount) > 0);
    } else if (status === 'unprinted') {
      filtered = rows.filter((r) => Number(r.printCount) === 0);
    }

    return NextResponse.json({
      attendees: filtered.map((r) => ({
        ...r,
        printCount: Number(r.printCount),
        hasPrinted: Number(r.printCount) > 0,
      })),
      total: filtered.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
