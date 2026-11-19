import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { attendees } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAttendeeSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional(),
  category: z.string().trim().min(1, 'Category cannot be empty').max(100).optional(),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email('Invalid email address').max(255).optional().nullable().or(z.literal('')),
  gender: z.string().trim().max(50).optional().nullable(),
  medicalCouncilNumber: z.string().trim().max(100).optional().nullable(),
  foodPreference: z.string().trim().max(50).optional(),
  paymentStatus: z.string().trim().max(50).optional(),
  attendanceStatus: z.enum(['not_checked_in', 'checked_in', 'checked_out']).optional(),
});

/**
 * GET /api/events/[eventId]/attendees/[attendeeId]
 * Fetches single attendee details scoped strictly to event.
 * Enforces PII redaction for low-privilege roles.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; attendeeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [attendee] = await db
      .select()
      .from(attendees)
      .where(and(
        eq(attendees.id, params.attendeeId),
        eq(attendees.eventId, context.event.id)
      ))
      .limit(1);

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found in this event', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const canViewPii = context.hasPermission('event:view_attendee_pii');
    const sanitized = canViewPii
      ? attendee
      : {
          ...attendee,
          phoneNumber: null,
          email: null,
          medicalCouncilNumber: null,
        };

    return NextResponse.json({
      status: 'ok',
      eventId: context.event.id,
      attendee: sanitized,
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
 * PATCH /api/events/[eventId]/attendees/[attendeeId]
 * Updates attendee record with atomic audit logging.
 * Requires 'event:update_attendee' permission.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; attendeeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:update_attendee');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const parsed = updateAttendeeSchema.safeParse(body);
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

    const updateFields = parsed.data;
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const [updatedAttendee] = await db.transaction(async (tx) => {
      // Lock attendee row FOR UPDATE and ensure event boundary
      const [existing] = await tx
        .select()
        .from(attendees)
        .where(and(
          eq(attendees.id, params.attendeeId),
          eq(attendees.eventId, context.event.id)
        ))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new AuthorizationError('Attendee not found in this event', 404, 'NOT_FOUND');
      }

      const patchPayload: Record<string, any> = {
        updatedAt: new Date(),
      };
      if (updateFields.name !== undefined) patchPayload.name = updateFields.name;
      if (updateFields.category !== undefined) patchPayload.category = updateFields.category;
      if (updateFields.phoneNumber !== undefined) patchPayload.phoneNumber = updateFields.phoneNumber || null;
      if (updateFields.email !== undefined) patchPayload.email = updateFields.email || null;
      if (updateFields.gender !== undefined) patchPayload.gender = updateFields.gender || null;
      if (updateFields.medicalCouncilNumber !== undefined) patchPayload.medicalCouncilNumber = updateFields.medicalCouncilNumber || null;
      if (updateFields.foodPreference !== undefined) patchPayload.foodPreference = updateFields.foodPreference;
      if (updateFields.paymentStatus !== undefined) patchPayload.paymentStatus = updateFields.paymentStatus;
      if (updateFields.attendanceStatus !== undefined) patchPayload.attendanceStatus = updateFields.attendanceStatus;

      const [updated] = await tx
        .update(attendees)
        .set(patchPayload)
        .where(and(
          eq(attendees.id, params.attendeeId),
          eq(attendees.eventId, context.event.id)
        ))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'attendee:updated',
          entityType: 'attendees',
          entityId: updated.id,
          details: {
            updatedFields: Object.keys(updateFields),
            registrationNumber: existing.registrationNumber,
          },
        },
        tx
      );

      return [updated];
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Attendee updated successfully',
      attendee: updatedAttendee,
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
 * DELETE /api/events/[eventId]/attendees/[attendeeId]
 * Deletes single attendee record atomically with audit logging.
 * Requires 'event:delete_attendee' permission (prohibited for registration_staff and scanner_operator).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; attendeeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:delete_attendee');

    const [deleted] = await db.transaction(async (tx) => {
      // Verify attendee belongs to this event and lock row
      const [existing] = await tx
        .select()
        .from(attendees)
        .where(and(
          eq(attendees.id, params.attendeeId),
          eq(attendees.eventId, context.event.id)
        ))
        .for('update')
        .limit(1);

      if (!existing) {
        throw new AuthorizationError('Attendee not found in this event', 404, 'NOT_FOUND');
      }

      const [res] = await tx
        .delete(attendees)
        .where(and(
          eq(attendees.id, params.attendeeId),
          eq(attendees.eventId, context.event.id)
        ))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'attendee:deleted',
          entityType: 'attendees',
          entityId: params.attendeeId,
          details: {
            registrationNumber: existing.registrationNumber,
            name: existing.name,
            category: existing.category,
          },
        },
        tx
      );

      return [res];
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Attendee deleted successfully',
      attendeeId: deleted.id,
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
