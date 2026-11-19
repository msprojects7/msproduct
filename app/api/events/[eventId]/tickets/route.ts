import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventTickets, ticketPriceRules } from '@/db/schema/index';
import { eq, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTicketSchema = z.object({
  name: z.string().trim().min(1, 'Ticket name is required').max(255),
  description: z.string().trim().optional().nullable(),
  ticketType: z.enum(['free', 'paid', 'donation']).default('paid'),
  category: z.enum(['general', 'vip', 'early_bird', 'standard', 'student', 'group', 'custom']).default('general'),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  currency: z.string().trim().max(10).default('INR'),
  totalQuantity: z.number().int().min(1, 'Quantity must be at least 1').default(100),
  minPerOrder: z.number().int().min(1).default(1),
  maxPerOrder: z.number().int().min(1).default(10),
  salesStart: z.string().datetime().optional().nullable(),
  salesEnd: z.string().datetime().optional().nullable(),
  visibility: z.enum(['public', 'hidden', 'access_code_only']).default('public'),
  status: z.enum(['draft', 'scheduled', 'on_sale', 'sold_out', 'paused', 'closed']).default('draft'),
  displayOrder: z.number().int().min(0).default(0),
});

/**
 * GET /api/events/[eventId]/tickets
 * Lists all ticket classes for the event with sales statistics and price rules.
 * Requires 'event:view' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const tickets = await db
      .select()
      .from(eventTickets)
      .where(eq(eventTickets.eventId, context.event.id))
      .orderBy(asc(eventTickets.displayOrder), asc(eventTickets.createdAt));

    // Fetch associated price rules
    const rules = await db
      .select()
      .from(ticketPriceRules)
      .where(eq(ticketPriceRules.eventId, context.event.id));

    const rulesByTicket = rules.reduce((acc, rule) => {
      acc[rule.ticketId] = acc[rule.ticketId] || [];
      acc[rule.ticketId].push(rule);
      return acc;
    }, {} as Record<string, typeof rules>);

    const enrichedTickets = tickets.map((t) => {
      const availableQuantity = Math.max(0, t.totalQuantity - t.soldQuantity - t.reservedQuantity);
      return {
        ...t,
        availableQuantity,
        priceRules: rulesByTicket[t.id] || [],
        isFree: Number(t.price) === 0 || t.ticketType === 'free',
      };
    });

    return NextResponse.json({
      status: 'ok',
      eventId: context.event.id,
      tickets: enrichedTickets,
      totalTicketsCount: tickets.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/tickets
 * Creates a new ticket class for the event.
 * Requires 'event:manage_tickets' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_tickets');

    const body = await request.json().catch(() => null);
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Enforce business rules
    if (data.ticketType === 'free' && data.price > 0) {
      return NextResponse.json(
        { error: 'Free tickets cannot have a price greater than 0' },
        { status: 400 }
      );
    }

    if (data.minPerOrder > data.maxPerOrder) {
      return NextResponse.json(
        { error: 'Minimum purchase per order cannot exceed maximum purchase per order' },
        { status: 400 }
      );
    }

    if (data.salesStart && data.salesEnd && new Date(data.salesStart) >= new Date(data.salesEnd)) {
      return NextResponse.json(
        { error: 'Sales start date must be before sales end date' },
        { status: 400 }
      );
    }

    const [createdTicket] = await db
      .insert(eventTickets)
      .values({
        eventId: context.event.id,
        name: data.name,
        description: data.description,
        ticketType: data.ticketType,
        category: data.category,
        price: data.price.toFixed(2),
        currency: data.currency.toUpperCase(),
        totalQuantity: data.totalQuantity,
        soldQuantity: 0,
        reservedQuantity: 0,
        minPerOrder: data.minPerOrder,
        maxPerOrder: data.maxPerOrder,
        salesStart: data.salesStart ? new Date(data.salesStart) : null,
        salesEnd: data.salesEnd ? new Date(data.salesEnd) : null,
        visibility: data.visibility,
        status: data.status,
        displayOrder: data.displayOrder,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'ticket.create',
      entityType: 'ticket',
      entityId: createdTicket.id,
      details: {
        name: createdTicket.name,
        ticketType: createdTicket.ticketType,
        price: createdTicket.price,
        totalQuantity: createdTicket.totalQuantity,
      },
    });

    return NextResponse.json(
      {
        status: 'ok',
        ticket: {
          ...createdTicket,
          availableQuantity: createdTicket.totalQuantity,
          priceRules: [],
          isFree: Number(createdTicket.price) === 0 || createdTicket.ticketType === 'free',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
