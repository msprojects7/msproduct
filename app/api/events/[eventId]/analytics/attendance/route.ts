import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  attendees,
  scanEvents,
  eventSessions,
  sessionAttendance,
} from '@/db/schema/index';
import { eq, and, sql, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_attendance_analytics');

    // 1. Overall Attendance Counts
    const [totalRes, checkedInRes, checkedOutRes] = await Promise.all([
      db.select({ val: count() }).from(attendees).where(eq(attendees.eventId, context.event.id)),
      db.select({ val: count() }).from(attendees).where(
        and(eq(attendees.eventId, context.event.id), eq(attendees.attendanceStatus, 'checked_in'))
      ),
      db.select({ val: count() }).from(attendees).where(
        and(eq(attendees.eventId, context.event.id), eq(attendees.attendanceStatus, 'checked_out'))
      ),
    ]);

    const totalAttendees = Number(totalRes[0]?.val || 0);
    const checkedIn = Number(checkedInRes[0]?.val || 0);
    const checkedOut = Number(checkedOutRes[0]?.val || 0);
    const notCheckedIn = Math.max(0, totalAttendees - checkedIn - checkedOut);
    const checkInRate = totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0;

    // 2. Attendance by Category
    const categoryBreakdown = await db
      .select({
        category: attendees.category,
        total: count(),
        checkedIn: sql<number>`count(*) filter (where ${attendees.attendanceStatus} = 'checked_in')`,
      })
      .from(attendees)
      .where(eq(attendees.eventId, context.event.id))
      .groupBy(attendees.category);

    // 3. Hourly Check-in Distribution
    const hourlyScans = await db
      .select({
        hour: sql<string>`to_char(${scanEvents.scannedAt}, 'YYYY-MM-DD HH24:00')`,
        scans: count(),
      })
      .from(scanEvents)
      .where(
        and(
          eq(scanEvents.eventId, context.event.id),
          eq(scanEvents.action, 'check_in')
        )
      )
      .groupBy(sql`to_char(${scanEvents.scannedAt}, 'YYYY-MM-DD HH24:00')`)
      .orderBy(sql`to_char(${scanEvents.scannedAt}, 'YYYY-MM-DD HH24:00')`);

    // 4. Session Attendance Utilization
    const sessions = await db
      .select({
        id: eventSessions.id,
        title: eventSessions.title,
        room: eventSessions.room,
        capacity: eventSessions.capacity,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
      })
      .from(eventSessions)
      .where(eq(eventSessions.eventId, context.event.id));

    const sessionStats = await Promise.all(
      sessions.map(async (sess) => {
        const [scansCount] = await db
          .select({ val: count() })
          .from(sessionAttendance)
          .where(
            and(
              eq(sessionAttendance.sessionId, sess.id),
              eq(sessionAttendance.action, 'check_in')
            )
          );
        const attended = Number(scansCount?.val || 0);
        const capacity = sess.capacity || 0;
        const utilization = capacity > 0 ? Math.round((attended / capacity) * 100) : null;

        return {
          id: sess.id,
          title: sess.title,
          room: sess.room,
          capacity,
          attended,
          utilization,
        };
      })
    );

    return NextResponse.json({
      overview: {
        totalAttendees,
        checkedIn,
        checkedOut,
        notCheckedIn,
        checkInRate,
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        total: Number(c.total),
        checkedIn: Number(c.checkedIn),
        rate: Number(c.total) > 0 ? Math.round((Number(c.checkedIn) / Number(c.total)) * 100) : 0,
      })),
      hourlyScans: hourlyScans.map((h) => ({
        hour: h.hour,
        count: Number(h.scans),
      })),
      sessionUtilization: sessionStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
