import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventTickets, ticketPriceRules } from '@/db/schema/index';
import { eq, and, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPriceRuleSchema = z.object({
  name: z.string().trim().min(1, 'Rule name is required').max(255),
  ruleType: z.enum(['early_bird', 'group', 'scheduled']),
  discountType: z.enum(['percentage', 'fixed_amount']).default('percentage'),
  discountValue: z.number().min(0.01, 'Discount value must be greater than 0'),
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/events/[eventId]/tickets/[ticketId]/rules
 * Lists all dynamic price rules for a ticket class.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [ticket] = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.id, params.ticketId), eq(eventTickets.eventId, context.event.id)))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const rules = await db
      .select()
      .from(ticketPriceRules)
      .where(eq(ticketPriceRules.ticketId, ticket.id))
      .orderBy(asc(ticketPriceRules.createdAt));

    return NextResponse.json({
      status: 'ok',
      ticketId: ticket.id,
      ticketName: ticket.name,
      rules,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/tickets/[ticketId]/rules
 * Creates an early-bird or group pricing rule for a ticket class.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_pricing');

    const [ticket] = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.id, params.ticketId), eq(eventTickets.eventId, context.event.id)))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createPriceRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate percentage does not exceed 100%
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Validate date intervals
    if (data.validFrom && data.validTo && new Date(data.validFrom) >= new Date(data.validTo)) {
      return NextResponse.json(
        { error: 'Rule validFrom date must precede validTo date' },
        { status: 400 }
      );
    }

    const [createdRule] = await db
      .insert(ticketPriceRules)
      .values({
        ticketId: ticket.id,
        eventId: context.event.id,
        name: data.name,
        ruleType: data.ruleType,
        discountType: data.discountType,
        discountValue: data.discountValue.toFixed(2),
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'price_rule.create',
      entityType: 'price_rule',
      entityId: createdRule.id,
      details: {
        ticketId: ticket.id,
        ruleName: createdRule.name,
        ruleType: createdRule.ruleType,
        discount: `${createdRule.discountValue} (${createdRule.discountType})`,
      },
    });

    return NextResponse.json(
      { status: 'ok', rule: createdRule },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
