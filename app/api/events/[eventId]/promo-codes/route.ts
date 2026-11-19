import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventPromoCodes, promoCodeRedemptions } from '@/db/schema/index';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPromoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain alphanumeric characters, underscores, and hyphens'),
  description: z.string().trim().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed_amount', 'free_ticket']).default('percentage'),
  discountValue: z.number().min(0, 'Discount value cannot be negative'),
  applicableTicketIds: z.array(z.string().uuid()).optional().nullable(),
  minPurchaseAmount: z.number().min(0).default(0),
  maxTotalRedemptions: z.number().int().min(1).optional().nullable(),
  maxRedemptionsPerUser: z.number().int().min(1).default(1),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/events/[eventId]/promo-codes
 * Lists all promotional codes with redemption counts and status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const codes = await db
      .select()
      .from(eventPromoCodes)
      .where(eq(eventPromoCodes.eventId, context.event.id))
      .orderBy(desc(eventPromoCodes.createdAt));

    // Get total savings per code
    const redemptions = await db
      .select({
        promoCodeId: promoCodeRedemptions.promoCodeId,
        totalSavings: sql<string>`sum(cast(${promoCodeRedemptions.discountApplied} as numeric))`,
      })
      .from(promoCodeRedemptions)
      .where(eq(promoCodeRedemptions.eventId, context.event.id))
      .groupBy(promoCodeRedemptions.promoCodeId);

    const savingsMap = redemptions.reduce((acc, r) => {
      acc[r.promoCodeId] = Number(r.totalSavings) || 0;
      return acc;
    }, {} as Record<string, number>);

    const enrichedCodes = codes.map((c) => {
      const now = new Date();
      let status: 'active' | 'inactive' | 'expired' | 'exhausted' | 'scheduled' = 'active';

      if (!c.isActive) status = 'inactive';
      else if (c.validFrom && new Date(c.validFrom) > now) status = 'scheduled';
      else if (c.validTo && new Date(c.validTo) < now) status = 'expired';
      else if (c.maxTotalRedemptions && c.currentRedemptions >= c.maxTotalRedemptions) status = 'exhausted';

      return {
        ...c,
        computedStatus: status,
        totalSavingsGiven: savingsMap[c.id] || 0,
      };
    });

    return NextResponse.json({
      status: 'ok',
      promoCodes: enrichedCodes,
      totalCount: codes.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/promo-codes
 * Creates a new promo code with event-scoped uniqueness.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_promocodes');

    const body = await request.json().catch(() => null);
    const parsed = createPromoCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedCode = data.code.toUpperCase();

    // Check duplicate code within this event (case-insensitive)
    const [existingCode] = await db
      .select({ id: eventPromoCodes.id })
      .from(eventPromoCodes)
      .where(and(
        eq(eventPromoCodes.eventId, context.event.id),
        ilike(eventPromoCodes.code, normalizedCode)
      ))
      .limit(1);

    if (existingCode) {
      return NextResponse.json(
        { error: `Promo code '${normalizedCode}' already exists for this event` },
        { status: 400 }
      );
    }

    // Validation rules
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    if (data.validFrom && data.validTo && new Date(data.validFrom) >= new Date(data.validTo)) {
      return NextResponse.json(
        { error: 'Validity start date must precede expiry date' },
        { status: 400 }
      );
    }

    const [createdCode] = await db
      .insert(eventPromoCodes)
      .values({
        eventId: context.event.id,
        code: normalizedCode,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountType === 'free_ticket' ? '100.00' : data.discountValue.toFixed(2),
        applicableTicketIds: data.applicableTicketIds && data.applicableTicketIds.length > 0
          ? data.applicableTicketIds
          : null,
        minPurchaseAmount: data.minPurchaseAmount.toFixed(2),
        maxTotalRedemptions: data.maxTotalRedemptions,
        currentRedemptions: 0,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'promo_code.create',
      entityType: 'promo_code',
      entityId: createdCode.id,
      details: {
        code: createdCode.code,
        discountType: createdCode.discountType,
        discountValue: createdCode.discountValue,
      },
    });

    return NextResponse.json(
      {
        status: 'ok',
        promoCode: {
          ...createdCode,
          computedStatus: createdCode.isActive ? 'active' : 'inactive',
          totalSavingsGiven: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
