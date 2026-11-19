import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { events } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[eventId]/archive
 * Archives an event without destroying historical attendee data.
 * Requires 'event:delete' permission (org owner or org admin).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:delete');

    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({
          status: 'archived',
          updatedAt: new Date(),
        })
        .where(eq(events.id, context.event.id));

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'event:archived',
          entityType: 'events',
          entityId: context.event.id,
          details: { name: context.event.name },
        },
        tx
      );
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Event archived successfully',
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
