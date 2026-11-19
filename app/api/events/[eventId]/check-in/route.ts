import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { attendees, scanEvents } from '@/db/schema/index';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';
import { executeCheckInOperation } from '@/lib/attendance/checkin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const checkInPayloadSchema = z.object({
  qrToken: z.string().trim().optional().nullable(),
  registrationNumber: z.string().trim().optional().nullable(),
  attendeeId: z.string().uuid().optional().nullable(),
  action: z.enum(['check_in', 'check_out']).default('check_in'),
  deviceInfo: z.string().trim().max(255).optional().nullable(),
  sessionId: z.string().trim().max(100).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_scans');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    // Search query mode
    if (search) {
      const isSearchUuid = UUID_REGEX.test(search);
      const whereCondition = isSearchUuid
        ? and(
            eq(attendees.eventId, context.event.id),
            or(eq(attendees.qrToken, search), eq(attendees.id, search))
          )
        : and(
            eq(attendees.eventId, context.event.id),
            or(
              ilike(attendees.registrationNumber, `%${search}%`),
              ilike(attendees.name, `%${search}%`),
              ilike(attendees.email, `%${search}%`)
            )
          );

      const matched = await db
        .select({
          id: attendees.id,
          name: attendees.name,
          registrationNumber: attendees.registrationNumber,
          category: attendees.category,
          email: attendees.email,
          phoneNumber: attendees.phoneNumber,
          attendanceStatus: attendees.attendanceStatus,
          paymentStatus: attendees.paymentStatus,
          foodPreference: attendees.foodPreference,
          medicalCouncilNumber: attendees.medicalCouncilNumber,
          qrToken: attendees.qrToken,
          createdAt: attendees.createdAt,
        })
        .from(attendees)
        .where(whereCondition)
        .limit(15);

      return NextResponse.json({ attendees: matched });
    }

    // Default overview statistics
    const [totalRes, checkedInRes] = await Promise.all([
      db.select({ val: count() }).from(attendees).where(eq(attendees.eventId, context.event.id)),
      db.select({ val: count() }).from(attendees).where(
        and(eq(attendees.eventId, context.event.id), eq(attendees.attendanceStatus, 'checked_in'))
      ),
    ]);

    const total = Number(totalRes[0]?.val || 0);
    const checkedIn = Number(checkedInRes[0]?.val || 0);

    const recentScans = await db
      .select({
        id: scanEvents.id,
        action: scanEvents.action,
        scannedAt: scanEvents.scannedAt,
        staffUserId: scanEvents.staffUserId,
        deviceInfo: scanEvents.deviceInfo,
        attendeeId: scanEvents.attendeeId,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
        attendanceStatus: attendees.attendanceStatus,
      })
      .from(scanEvents)
      .innerJoin(attendees, eq(scanEvents.attendeeId, attendees.id))
      .where(eq(scanEvents.eventId, context.event.id))
      .orderBy(desc(scanEvents.scannedAt))
      .limit(30);

    return NextResponse.json({
      stats: {
        totalAttendees: total,
        checkedIn,
        notCheckedIn: Math.max(0, total - checkedIn),
        checkInPercentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      },
      recentScans,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_checkin');

    const body = await request.json().catch(() => null);
    const parsed = checkInPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid check-in payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await executeCheckInOperation({
      eventId: context.event.id,
      organizationId: context.organization.id,
      operatorUserId: context.user.id,
      qrToken: parsed.data.qrToken,
      registrationNumber: parsed.data.registrationNumber,
      attendeeId: parsed.data.attendeeId,
      action: parsed.data.action,
      deviceInfo: parsed.data.deviceInfo,
      sessionId: parsed.data.sessionId,
      isOverride: false,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    const statusCode = result.success ? 200 : result.code === 'ALREADY_CHECKED_IN' ? 409 : 400;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return handleApiError(error);
  }
}
