import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventStaffAssignments } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[eventId]/staff
 * Lists all staff members assigned to the specified event.
 * Requires 'event:manage_staff' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_staff');

    const staffList = await db
      .select({
        id: eventStaffAssignments.id,
        eventId: eventStaffAssignments.eventId,
        userId: eventStaffAssignments.userId,
        role: eventStaffAssignments.role,
        isActive: eventStaffAssignments.isActive,
        createdAt: eventStaffAssignments.createdAt,
      })
      .from(eventStaffAssignments)
      .where(eq(eventStaffAssignments.eventId, context.event.id));

    return NextResponse.json({
      status: 'ok',
      eventId: context.event.id,
      staff: staffList,
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
 * POST /api/events/[eventId]/staff
 * Assigns a user to an event role (event_manager, registration_staff, scanner_operator).
 * Requires 'event:manage_staff' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_staff');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { userId, role } = body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { error: 'userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const validRoles = ['event_manager', 'registration_staff', 'scanner_operator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Staff role must be one of: ${validRoles.join(', ')}`, code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    const [assignment] = await db.transaction(async (tx) => {
      const [upserted] = await tx
        .insert(eventStaffAssignments)
        .values({
          eventId: context.event.id,
          userId: userId.trim(),
          role,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [eventStaffAssignments.eventId, eventStaffAssignments.userId],
          set: {
            role,
            isActive: true,
          },
        })
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'staff:assigned',
          entityType: 'event_staff_assignments',
          entityId: upserted.id,
          details: {
            assignedUserId: userId.trim(),
            role,
          },
        },
        tx
      );

      return [upserted];
    });

    return NextResponse.json(
      {
        status: 'ok',
        assignment,
      },
      { status: 201 }
    );
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
