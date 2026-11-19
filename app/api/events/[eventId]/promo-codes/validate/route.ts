import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventTickets, eventPromoCodes, promoCodeRedemptions, ticketPriceRules } from '@/db/schema/index';
import { eq, and, ilike } from 'drizzle-orm';
import { calculateTicketPricing } from '@/lib/ticketing/pricing';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const validatePromoSchema = z.object({
  code: z.string().trim().min(1, 'Promo code is required'),
  ticketId: z.string().uuid('Invalid ticket ID'),
  quantity: z.number().int().min(1).default(1),
  attendeeEmail: z.string().trim().email().optional().nullable(),
});

/**
 * POST /api/events/[eventId]/promo-codes/validate
 * Validates a promo code against a specific ticket and calculates the exact discount.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    // Requires view access (can be queried by organizers and future attendees)
    context.assertPermission('event:view');

    const body = await request.json().catch(() => null);
    const parsed = validatePromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { code, ticketId, quantity, attendeeEmail } = parsed.data;

    // 1. Fetch ticket and its active price rules
    const [ticket] = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.id, ticketId), eq(eventTickets.eventId, context.event.id)))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const rules = await db
      .select()
      .from(ticketPriceRules)
      .where(and(eq(ticketPriceRules.ticketId, ticket.id), eq(ticketPriceRules.isActive, true)));

    // 2. Fetch promo code
    const [promo] = await db
      .select()
      .from(eventPromoCodes)
      .where(and(
        eq(eventPromoCodes.eventId, context.event.id),
        ilike(eventPromoCodes.code, code)
      ))
      .limit(1);

    if (!promo) {
      return NextResponse.json(
        { error: `Promo code '${code.toUpperCase()}' not found`, code: 'PROMO_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!promo.isActive) {
      return NextResponse.json(
        { error: 'This promo code is currently disabled', code: 'PROMO_INACTIVE' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return NextResponse.json(
        { error: 'This promo code is not yet active', code: 'PROMO_NOT_STARTED' },
        { status: 400 }
      );
    }

    if (promo.validTo && new Date(promo.validTo) < now) {
      return NextResponse.json(
        { error: 'This promo code has expired', code: 'PROMO_EXPIRED' },
        { status: 400 }
      );
    }

    if (promo.maxTotalRedemptions && promo.currentRedemptions >= promo.maxTotalRedemptions) {
      return NextResponse.json(
        { error: 'This promo code has reached its maximum redemptions', code: 'PROMO_EXHAUSTED' },
        { status: 400 }
      );
    }

    if (
      promo.applicableTicketIds &&
      Array.isArray(promo.applicableTicketIds) &&
      promo.applicableTicketIds.length > 0 &&
      !promo.applicableTicketIds.includes(ticket.id)
    ) {
      return NextResponse.json(
        { error: 'This promo code is not applicable to the selected ticket category', code: 'PROMO_TICKET_INELIGIBLE' },
        { status: 400 }
      );
    }

    // Check user redemption count if email supplied
    let userRedemptions = 0;
    if (attendeeEmail) {
      const redemptions = await db
        .select()
        .from(promoCodeRedemptions)
        .where(and(
          eq(promoCodeRedemptions.promoCodeId, promo.id),
          eq(promoCodeRedemptions.attendeeEmail, attendeeEmail.toLowerCase())
        ));
      userRedemptions = redemptions.length;

      if (promo.maxRedemptionsPerUser && userRedemptions >= promo.maxRedemptionsPerUser) {
        return NextResponse.json(
          { error: 'You have already reached the maximum allowed redemptions for this promo code', code: 'PROMO_USER_LIMIT' },
          { status: 400 }
        );
      }
    }

    // 3. Compute final pricing server-side
    const pricing = calculateTicketPricing({
      unitPrice: Number(ticket.price),
      quantity,
      currency: ticket.currency,
      rules,
      promoCode: promo,
      ticketId: ticket.id,
      userRedemptionCount: userRedemptions,
    });

    if (pricing.appliedPromo === null) {
      return NextResponse.json(
        {
          error: `Minimum purchase amount of ${ticket.currency} ${promo.minPurchaseAmount} required for this promo code`,
          code: 'PROMO_MIN_PURCHASE_NOT_MET',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      valid: true,
      pricing,
      promoCode: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
