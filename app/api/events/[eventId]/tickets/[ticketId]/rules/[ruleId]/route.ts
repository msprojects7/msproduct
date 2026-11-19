import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { ticketPriceRules } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updatePriceRuleSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  discountType: z.enum(['percentage', 'fixed_amount']).optional(),
  discountValue: z.number().min(0.01).optional(),
  minQuantity: z.number().int().min(1).optional(),
  maxQuantity: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]
 * Updates a dynamic pricing rule.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string; ruleId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_pricing');

    const [rule] = await db
      .select()
      .from(ticketPriceRules)
      .where(and(
        eq(ticketPriceRules.id, params.ruleId),
        eq(ticketPriceRules.ticketId, params.ticketId),
        eq(ticketPriceRules.eventId, context.event.id)
      ))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: 'Price rule not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updatePriceRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updatePayload: Partial<typeof ticketPriceRules.$inferInsert> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.discountType !== undefined) updatePayload.discountType = data.discountType;
    if (data.discountValue !== undefined) updatePayload.discountValue = data.discountValue.toFixed(2);
    if (data.minQuantity !== undefined) updatePayload.minQuantity = data.minQuantity;
    if (data.maxQuantity !== undefined) updatePayload.maxQuantity = data.maxQuantity;
    if (data.validFrom !== undefined) updatePayload.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    if (data.validTo !== undefined) updatePayload.validTo = data.validTo ? new Date(data.validTo) : null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const [updatedRule] = await db
      .update(ticketPriceRules)
      .set(updatePayload)
      .where(eq(ticketPriceRules.id, rule.id))
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'price_rule.update',
      entityType: 'price_rule',
      entityId: updatedRule.id,
      details: {
        changes: data,
      },
    });

    return NextResponse.json({ status: 'ok', rule: updatedRule });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/events/[eventId]/tickets/[ticketId]/rules/[ruleId]
 * Deletes a dynamic pricing rule.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string; ruleId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_pricing');

    const [rule] = await db
      .select()
      .from(ticketPriceRules)
      .where(and(
        eq(ticketPriceRules.id, params.ruleId),
        eq(ticketPriceRules.ticketId, params.ticketId),
        eq(ticketPriceRules.eventId, context.event.id)
      ))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: 'Price rule not found' }, { status: 404 });
    }

    await db.delete(ticketPriceRules).where(eq(ticketPriceRules.id, rule.id));

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'price_rule.delete',
      entityType: 'price_rule',
      entityId: rule.id,
      details: {
        name: rule.name,
        ticketId: rule.ticketId,
      },
    });

    return NextResponse.json({ status: 'ok', message: 'Price rule deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
