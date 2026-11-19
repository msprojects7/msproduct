import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventPromoCodes, promoCodeRedemptions } from '@/db/schema/index';
import { eq, and, desc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updatePromoCodeSchema = z.object({
  description: z.string().trim().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed_amount', 'free_ticket']).optional(),
  discountValue: z.number().min(0).optional(),
  applicableTicketIds: z.array(z.string().uuid()).optional().nullable(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxTotalRedemptions: z.number().int().min(1).optional().nullable(),
  maxRedemptionsPerUser: z.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/events/[eventId]/promo-codes/[codeId]
 * Retrieves details and recent redemption log for a promotional code.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; codeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [code] = await db
      .select()
      .from(eventPromoCodes)
      .where(and(eq(eventPromoCodes.id, params.codeId), eq(eventPromoCodes.eventId, context.event.id)))
      .limit(1);

    if (!code) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    const redemptions = await db
      .select()
      .from(promoCodeRedemptions)
      .where(eq(promoCodeRedemptions.promoCodeId, code.id))
      .orderBy(desc(promoCodeRedemptions.redeemedAt))
      .limit(50);

    return NextResponse.json({
      status: 'ok',
      promoCode: code,
      redemptions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/events/[eventId]/promo-codes/[codeId]
 * Updates promotional code settings, active status, or usage caps.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; codeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_promocodes');

    const [existingCode] = await db
      .select()
      .from(eventPromoCodes)
      .where(and(eq(eventPromoCodes.id, params.codeId), eq(eventPromoCodes.eventId, context.event.id)))
      .limit(1);

    if (!existingCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updatePromoCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updatePayload: Partial<typeof eventPromoCodes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.discountType !== undefined) updatePayload.discountType = data.discountType;
    if (data.discountValue !== undefined) updatePayload.discountValue = data.discountValue.toFixed(2);
    if (data.applicableTicketIds !== undefined) updatePayload.applicableTicketIds = data.applicableTicketIds;
    if (data.minPurchaseAmount !== undefined) updatePayload.minPurchaseAmount = data.minPurchaseAmount.toFixed(2);
    if (data.maxTotalRedemptions !== undefined) updatePayload.maxTotalRedemptions = data.maxTotalRedemptions;
    if (data.maxRedemptionsPerUser !== undefined) updatePayload.maxRedemptionsPerUser = data.maxRedemptionsPerUser;
    if (data.validFrom !== undefined) updatePayload.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    if (data.validTo !== undefined) updatePayload.validTo = data.validTo ? new Date(data.validTo) : null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const [updatedCode] = await db
      .update(eventPromoCodes)
      .set(updatePayload)
      .where(eq(eventPromoCodes.id, existingCode.id))
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'promo_code.update',
      entityType: 'promo_code',
      entityId: updatedCode.id,
      details: {
        changes: data,
      },
    });

    return NextResponse.json({ status: 'ok', promoCode: updatedCode });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/events/[eventId]/promo-codes/[codeId]
 * Deletes or archives a promotional code.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; codeId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_promocodes');

    const [code] = await db
      .select()
      .from(eventPromoCodes)
      .where(and(eq(eventPromoCodes.id, params.codeId), eq(eventPromoCodes.eventId, context.event.id)))
      .limit(1);

    if (!code) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    await db.delete(eventPromoCodes).where(eq(eventPromoCodes.id, code.id));

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'promo_code.delete',
      entityType: 'promo_code',
      entityId: code.id,
      details: {
        code: code.code,
      },
    });

    return NextResponse.json({ status: 'ok', message: 'Promo code deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
