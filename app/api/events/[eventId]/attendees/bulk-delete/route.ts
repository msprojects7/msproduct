import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { attendees } from '@/db/schema/index';
import { and, inArray, eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid('Each ID must be a valid UUID'))
    .min(1, 'At least one attendee ID is required')
    .max(500, 'Maximum 500 attendees can be deleted in a single bulk operation'),
});

/**
 * POST /api/events/[eventId]/attendees/bulk-delete
 * Bulk deletes attendees with strict event isolation and transactional audit logging.
 * Guarantees that IDs from other events or organizations cannot be affected.
 * Requires 'event:delete_attendee' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:delete_attendee');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const parsed = bulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { ids } = parsed.data;

    // Transactionally delete only attendees strictly belonging to this event
    const result = await db.transaction(async (tx) => {
      // Find IDs that genuinely belong to this event
      const matchingAttendees = await tx
        .select({
          id: attendees.id,
          registrationNumber: attendees.registrationNumber,
        })
        .from(attendees)
        .where(and(
          inArray(attendees.id, ids),
          eq(attendees.eventId, context.event.id)
        ))
        .for('update');

      if (matchingAttendees.length === 0) {
        return {
          deletedCount: 0,
          deletedIds: [],
        };
      }

      const verifiedIds = matchingAttendees.map((a) => a.id);

      await tx
        .delete(attendees)
        .where(and(
          inArray(attendees.id, verifiedIds),
          eq(attendees.eventId, context.event.id)
        ));

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'attendees:bulk_deleted',
          entityType: 'attendees',
          entityId: context.event.id,
          details: {
            requestedCount: ids.length,
            deletedCount: verifiedIds.length,
            deletedIds: verifiedIds,
          },
        },
        tx
      );

      return {
        deletedCount: verifiedIds.length,
        deletedIds: verifiedIds,
      };
    });

    return NextResponse.json({
      status: 'ok',
      message: `Successfully deleted ${result.deletedCount} attendee(s)`,
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds,
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
