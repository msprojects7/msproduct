import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventTickets, ticketPriceRules, registrationOrders } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateTicketSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  ticketType: z.enum(['free', 'paid', 'donation']).optional(),
  category: z.enum(['general', 'vip', 'early_bird', 'standard', 'student', 'group', 'custom']).optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  currency: z.string().trim().max(10).optional(),
  totalQuantity: z.number().int().min(1).optional(),
  minPerOrder: z.number().int().min(1).optional(),
  maxPerOrder: z.number().int().min(1).optional(),
  salesStart: z.string().datetime().optional().nullable(),
  salesEnd: z.string().datetime().optional().nullable(),
  visibility: z.enum(['public', 'hidden', 'access_code_only']).optional(),
  status: z.enum(['draft', 'scheduled', 'on_sale', 'sold_out', 'paused', 'closed']).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * GET /api/events/[eventId]/tickets/[ticketId]
 * Retrieves ticket details, available inventory, and associated price rules.
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
      .where(eq(ticketPriceRules.ticketId, ticket.id));

    return NextResponse.json({
      status: 'ok',
      ticket: {
        ...ticket,
        availableQuantity: Math.max(0, ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity),
        priceRules: rules,
        isFree: Number(ticket.price) === 0 || ticket.ticketType === 'free',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/events/[eventId]/tickets/[ticketId]
 * Updates ticket settings, pricing, inventory limits, and status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_tickets');

    const [existingTicket] = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.id, params.ticketId), eq(eventTickets.eventId, context.event.id)))
      .limit(1);

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate that new total quantity is not less than already sold quantity
    if (data.totalQuantity !== undefined && data.totalQuantity < existingTicket.soldQuantity) {
      return NextResponse.json(
        {
          error: `Total quantity cannot be less than already sold tickets (${existingTicket.soldQuantity} sold)`,
        },
        { status: 400 }
      );
    }

    // Validate date order
    const salesStart = data.salesStart !== undefined
      ? (data.salesStart ? new Date(data.salesStart) : null)
      : existingTicket.salesStart;
    const salesEnd = data.salesEnd !== undefined
      ? (data.salesEnd ? new Date(data.salesEnd) : null)
      : existingTicket.salesEnd;

    if (salesStart && salesEnd && salesStart >= salesEnd) {
      return NextResponse.json(
        { error: 'Sales start date must be before sales end date' },
        { status: 400 }
      );
    }

    const updatePayload: Partial<typeof eventTickets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.ticketType !== undefined) updatePayload.ticketType = data.ticketType;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.price !== undefined) updatePayload.price = data.price.toFixed(2);
    if (data.currency !== undefined) updatePayload.currency = data.currency.toUpperCase();
    if (data.totalQuantity !== undefined) updatePayload.totalQuantity = data.totalQuantity;
    if (data.minPerOrder !== undefined) updatePayload.minPerOrder = data.minPerOrder;
    if (data.maxPerOrder !== undefined) updatePayload.maxPerOrder = data.maxPerOrder;
    if (data.salesStart !== undefined) updatePayload.salesStart = salesStart;
    if (data.salesEnd !== undefined) updatePayload.salesEnd = salesEnd;
    if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder;

    const [updatedTicket] = await db
      .update(eventTickets)
      .set(updatePayload)
      .where(eq(eventTickets.id, existingTicket.id))
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'ticket.update',
      entityType: 'ticket',
      entityId: updatedTicket.id,
      details: {
        changes: data,
        previousState: {
          name: existingTicket.name,
          price: existingTicket.price,
          status: existingTicket.status,
          totalQuantity: existingTicket.totalQuantity,
        },
      },
    });

    return NextResponse.json({
      status: 'ok',
      ticket: {
        ...updatedTicket,
        availableQuantity: Math.max(
          0,
          updatedTicket.totalQuantity - updatedTicket.soldQuantity - updatedTicket.reservedQuantity
        ),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/events/[eventId]/tickets/[ticketId]
 * Deletes a ticket class. Prevents deletion if existing registrations/orders exist!
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_tickets');

    const [ticket] = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.id, params.ticketId), eq(eventTickets.eventId, context.event.id)))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if any orders exist for this ticket
    const [existingOrder] = await db
      .select({ id: registrationOrders.id })
      .from(registrationOrders)
      .where(eq(registrationOrders.ticketId, ticket.id))
      .limit(1);

    if (existingOrder || ticket.soldQuantity > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete ticket with existing registrations or sales. Change status to "paused" or "closed" instead.',
          code: 'TICKET_HAS_ORDERS',
        },
        { status: 400 }
      );
    }

    await db.delete(eventTickets).where(eq(eventTickets.id, ticket.id));

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'ticket.delete',
      entityType: 'ticket',
      entityId: ticket.id,
      details: {
        name: ticket.name,
        price: ticket.price,
      },
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Ticket deleted successfully',
      deletedTicketId: ticket.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
