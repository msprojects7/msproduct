import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import {
  attendees,
  badgePrintEvents,
  auditEvents,
} from '@/db/schema/index';
import { eq, and, inArray, desc, sql, count } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const printRequestSchema = z.object({
  attendeeIds: z.array(z.string().uuid()).min(1, 'At least one attendee ID is required').max(200, 'Batch print limited to 200 badges per request'),
  printType: z.enum(['single', 'reprint', 'batch', 'selected']),
  reason: z.string().trim().max(500).optional().nullable(),
  deviceInfo: z.string().trim().max(255).optional().nullable(),
});

/**
 * GET /api/events/[eventId]/badges/print
 * Retrieves print history for an event or checks print status for a specific attendee.
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
    const attendeeId = searchParams.get('attendeeId')?.trim();

    if (attendeeId) {
      // Check print status for a specific attendee
      const [attendee] = await db
        .select({ id: attendees.id, name: attendees.name, registrationNumber: attendees.registrationNumber })
        .from(attendees)
        .where(
          and(
            eq(attendees.id, attendeeId),
            eq(attendees.eventId, context.event.id)
          )
        )
        .limit(1);

      if (!attendee) {
        return NextResponse.json(
          { error: 'Attendee not found in this event' },
          { status: 404 }
        );
      }

      const printHistory = await db
        .select()
        .from(badgePrintEvents)
        .where(
          and(
            eq(badgePrintEvents.attendeeId, attendeeId),
            eq(badgePrintEvents.eventId, context.event.id)
          )
        )
        .orderBy(desc(badgePrintEvents.printedAt));

      return NextResponse.json({
        attendee,
        hasPrinted: printHistory.length > 0,
        printCount: printHistory.length,
        history: printHistory,
      });
    }

    // Default: Return latest 30 print events across the event
    const recentPrints = await db
      .select({
        id: badgePrintEvents.id,
        printType: badgePrintEvents.printType,
        reason: badgePrintEvents.reason,
        printedAt: badgePrintEvents.printedAt,
        staffUserId: badgePrintEvents.staffUserId,
        deviceInfo: badgePrintEvents.deviceInfo,
        attendeeId: badgePrintEvents.attendeeId,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
      })
      .from(badgePrintEvents)
      .innerJoin(attendees, eq(badgePrintEvents.attendeeId, attendees.id))
      .where(eq(badgePrintEvents.eventId, context.event.id))
      .orderBy(desc(badgePrintEvents.printedAt))
      .limit(30);

    return NextResponse.json({
      recentPrints,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Badge print GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve print history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[eventId]/badges/print
 * Records badge print/reprint events and audit logs.
 * Requires 'event:print_badge' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:print_badge');

    const body = await request.json().catch(() => null);
    const parsed = printRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid print request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attendeeIds, printType, reason, deviceInfo } = parsed.data;

    // Verify all attendees exist and belong to this event (strict tenant boundary!)
    const matchedAttendees = await db
      .select({
        id: attendees.id,
        name: attendees.name,
        registrationNumber: attendees.registrationNumber,
      })
      .from(attendees)
      .where(
        and(
          eq(attendees.eventId, context.event.id),
          inArray(attendees.id, attendeeIds)
        )
      );

    if (matchedAttendees.length !== attendeeIds.length) {
      return NextResponse.json(
        {
          error: 'One or more attendees could not be found in this event',
          matchedCount: matchedAttendees.length,
          requestedCount: attendeeIds.length,
        },
        { status: 403 }
      );
    }

    // Business rule: If printType is 'reprint', or if this is a single print and attendee was already printed, require reason!
    if (printType === 'reprint' && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: 'A reprint reason is required when reprinting badges' },
        { status: 400 }
      );
    }

    // Atomically insert print events and write audit logs
    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const insertRows = attendeeIds.map((id) => ({
        eventId: context.event.id,
        attendeeId: id,
        printType,
        reason: reason || null,
        staffUserId: context.user.id,
        printedAt: now,
        deviceInfo: deviceInfo || null,
      }));

      const inserted = await tx
        .insert(badgePrintEvents)
        .values(insertRows)
        .returning({ id: badgePrintEvents.id });

      const auditAction = printType === 'reprint' ? 'badge:reprinted' : 'badge:printed';

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: auditAction,
          entityType: 'badge',
          entityId: attendeeIds.length === 1 ? attendeeIds[0] : null,
          details: {
            printType,
            count: attendeeIds.length,
            attendeeIds,
            reason: reason || null,
            deviceInfo: deviceInfo || null,
          },
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
        tx
      );

      return {
        count: inserted.length,
        printedAt: now,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Recorded ${result.count} badge print event${result.count === 1 ? '' : 's'}`,
      count: result.count,
      printType,
      printedAt: result.printedAt,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Badge print POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record badge print event' },
      { status: 500 }
    );
  }
}
