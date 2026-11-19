import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventStaffAssignments } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/events/[eventId]/staff/[assignmentId]
 * Deactivates or removes a staff assignment for the event.
 * Requires 'event:manage_staff' permission.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; assignmentId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_staff');

    const [assignment] = await db
      .select()
      .from(eventStaffAssignments)
      .where(
        and(
          eq(eventStaffAssignments.id, params.assignmentId),
          eq(eventStaffAssignments.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Staff assignment not found for this event', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(eventStaffAssignments)
        .set({ isActive: false })
        .where(eq(eventStaffAssignments.id, assignment.id));

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'staff:removed',
          entityType: 'event_staff_assignments',
          entityId: assignment.id,
          details: {
            removedUserId: assignment.userId,
            role: assignment.role,
          },
        },
        tx
      );
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Staff assignment removed successfully',
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
