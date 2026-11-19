import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { registrationFormFields } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reorderSchema = z.object({
  fieldOrders: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
    })
  ).min(1, 'At least one field order required'),
});

/**
 * POST /api/events/[eventId]/registration-forms/reorder
 * Batch updates display orders for drag-and-drop form reordering.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_registration_forms');

    const body = await request.json().catch(() => null);
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { fieldOrders } = parsed.data;

    await db.transaction(async (tx) => {
      for (const item of fieldOrders) {
        await tx
          .update(registrationFormFields)
          .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
          .where(and(
            eq(registrationFormFields.id, item.id),
            eq(registrationFormFields.eventId, context.event.id)
          ));
      }
    });

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration_form.reorder',
      entityType: 'registration_form',
      details: {
        reorderedCount: fieldOrders.length,
      },
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Field display orders updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
