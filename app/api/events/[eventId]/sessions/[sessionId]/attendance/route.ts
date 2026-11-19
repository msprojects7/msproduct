import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  eventSessions,
  attendees,
  sessionAttendance,
} from '@/db/schema/index';
import { eq, and, count, desc, or } from 'drizzle-orm';
import { extractScanIdentifier } from '@/lib/attendance/checkin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sessionScanSchema = z.object({
  qrToken: z.string().trim().optional().nullable(),
  registrationNumber: z.string().trim().optional().nullable(),
  attendeeId: z.string().uuid().optional().nullable(),
  action: z.enum(['check_in', 'check_out']).default('check_in'),
  allowOvercapacity: z.boolean().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; sessionId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_session_attendance');

    const [session] = await db
      .select()
      .from(eventSessions)
      .where(
        and(
          eq(eventSessions.id, params.sessionId),
          eq(eventSessions.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const [checkedInCountRes] = await db
      .select({ val: count() })
      .from(sessionAttendance)
      .where(
        and(
          eq(sessionAttendance.sessionId, session.id),
          eq(sessionAttendance.action, 'check_in')
        )
      );

    const checkedInCount = Number(checkedInCountRes?.val || 0);
    const capacity = session.capacity || 0;
    const isFull = capacity > 0 && checkedInCount >= capacity;

    const recentAttendance = await db
      .select({
        id: sessionAttendance.id,
        action: sessionAttendance.action,
        scannedAt: sessionAttendance.scannedAt,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
      })
      .from(sessionAttendance)
      .innerJoin(attendees, eq(sessionAttendance.attendeeId, attendees.id))
      .where(eq(sessionAttendance.sessionId, session.id))
      .orderBy(desc(sessionAttendance.scannedAt))
      .limit(20);

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        room: session.room,
        capacity: session.capacity,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      stats: {
        currentAttendance: checkedInCount,
        capacity,
        remainingCapacity: capacity > 0 ? Math.max(0, capacity - checkedInCount) : null,
        isFull,
      },
      recentAttendance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; sessionId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_session_attendance');

    const [session] = await db
      .select()
      .from(eventSessions)
      .where(
        and(
          eq(eventSessions.id, params.sessionId),
          eq(eventSessions.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = sessionScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid session scan payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { qrToken, registrationNumber, attendeeId, action, allowOvercapacity } = parsed.data;

    let searchQr = qrToken || undefined;
    let searchReg = registrationNumber || undefined;

    if (qrToken && !registrationNumber) {
      const candidate = extractScanIdentifier(qrToken);
      searchQr = candidate.qrToken;
      searchReg = candidate.regNumber;
    }

    let attendeeCondition;
    if (attendeeId) {
      attendeeCondition = and(eq(attendees.eventId, context.event.id), eq(attendees.id, attendeeId));
    } else if (searchQr && UUID_REGEX.test(searchQr)) {
      attendeeCondition = and(
        eq(attendees.eventId, context.event.id),
        or(eq(attendees.qrToken, searchQr), eq(attendees.id, searchQr))
      );
    } else if (searchReg) {
      attendeeCondition = and(
        eq(attendees.eventId, context.event.id),
        eq(attendees.registrationNumber, searchReg)
      );
    } else {
      return NextResponse.json(
        { error: 'Attendee identification required' },
        { status: 400 }
      );
    }

    const [attendee] = await db.select().from(attendees).where(attendeeCondition).limit(1);

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found in this event' },
        { status: 404 }
      );
    }

    // Check capacity if check_in and capacity limit exists
    if (action === 'check_in' && session.capacity && session.capacity > 0 && !allowOvercapacity) {
      const [countRes] = await db
        .select({ val: count() })
        .from(sessionAttendance)
        .where(
          and(
            eq(sessionAttendance.sessionId, session.id),
            eq(sessionAttendance.action, 'check_in')
          )
        );

      const currentCount = Number(countRes?.val || 0);
      if (currentCount >= session.capacity) {
        return NextResponse.json(
          {
            error: 'Session room is at full capacity',
            code: 'SESSION_CAPACITY_EXCEEDED',
            capacity: session.capacity,
            currentAttendance: currentCount,
          },
          { status: 409 }
        );
      }
    }

    // Record session attendance
    const now = new Date();
    await db.insert(sessionAttendance).values({
      eventId: context.event.id,
      sessionId: session.id,
      attendeeId: attendee.id,
      action,
      scannedAt: now,
      staffUserId: context.user.id,
      deviceInfo: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: `${action === 'check_in' ? 'Admitted to' : 'Checked out of'} ${session.title}`,
      attendee: {
        id: attendee.id,
        name: attendee.name,
        registrationNumber: attendee.registrationNumber,
        category: attendee.category,
      },
      session: {
        id: session.id,
        title: session.title,
        room: session.room,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
