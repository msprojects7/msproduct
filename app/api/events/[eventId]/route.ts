import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { events } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[eventId]
 * Retrieves event details, scoped organization info, and effective user role.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [eventRecord] = await db
      .select()
      .from(events)
      .where(eq(events.id, context.event.id))
      .limit(1);

    return NextResponse.json({
      status: 'ok',
      event: eventRecord,
      organization: context.organization,
      effectiveRole: context.effectiveRole,
      user: {
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[eventId]
 * Updates event details (name, venue, startDate, endDate, status).
 * Requires 'event:update' permission.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:update');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { name, venue, startDate, endDate, status } = body;
    const updates: Partial<{
      name: string;
      venue: string | null;
      startDate: Date | null;
      endDate: Date | null;
      status: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Event name must be between 2 and 100 characters', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (venue !== undefined) {
      updates.venue = typeof venue === 'string' && venue.trim() ? venue.trim() : null;
    }

    if (startDate !== undefined) {
      updates.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      updates.endDate = endDate ? new Date(endDate) : null;
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'published', 'ongoing', 'archived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    const [updatedEvent] = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(events)
        .set(updates)
        .where(eq(events.id, context.event.id))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'event:updated',
          entityType: 'events',
          entityId: context.event.id,
          details: { updates },
        },
        tx
      );

      return [res];
    });

    return NextResponse.json({
      status: 'ok',
      event: updatedEvent,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
