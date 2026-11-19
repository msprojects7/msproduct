import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  registrationOrders,
  events,
  organizations,
  attendees,
  ticketDocuments,
  eventTickets,
} from '@/db/schema/index';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/orders/[orderReference]
 * Retrieves order status, confirmed attendees, and ticket download references
 * for public confirmation display.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderReference: string } }
) {
  try {
    const orderReference = params.orderReference;
    if (!orderReference) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 });
    }

    // 1. Resolve order
    const [order] = await db
      .select({
        id: registrationOrders.id,
        orderNumber: registrationOrders.orderNumber,
        orderReference: registrationOrders.orderReference,
        status: registrationOrders.status,
        currency: registrationOrders.currency,
        quantity: registrationOrders.quantity,
        grossAmount: registrationOrders.grossAmount,
        discountAmount: registrationOrders.discountAmount,
        taxAmount: registrationOrders.taxAmount,
        finalAmount: registrationOrders.finalAmount,
        customerName: registrationOrders.customerName,
        customerEmail: registrationOrders.customerEmail,
        customerPhone: registrationOrders.customerPhone,
        paymentProvider: registrationOrders.paymentProvider,
        paymentReference: registrationOrders.paymentReference,
        reservationExpiresAt: registrationOrders.reservationExpiresAt,
        createdAt: registrationOrders.createdAt,
        eventId: registrationOrders.eventId,
        ticketId: registrationOrders.ticketId,
      })
      .from(registrationOrders)
      .where(eq(registrationOrders.orderReference, orderReference))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Resolve event and organization
    const [event] = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        venue: events.venue,
        startDate: events.startDate,
        endDate: events.endDate,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1);

    const [org] = await db
      .select({
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, event.organizationId))
      .limit(1);

    // 3. Resolve confirmed ticket documents and attendees
    const docs = await db
      .select({
        ticketToken: ticketDocuments.ticketToken,
        status: ticketDocuments.status,
        attendeeId: attendees.id,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
        qrToken: attendees.qrToken,
      })
      .from(ticketDocuments)
      .innerJoin(attendees, eq(ticketDocuments.attendeeId, attendees.id))
      .where(eq(ticketDocuments.orderId, order.id));

    // Resolve primary ticket name for display
    const [ticket] = await db
      .select({ name: eventTickets.name })
      .from(eventTickets)
      .where(eq(eventTickets.id, order.ticketId))
      .limit(1);

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        orderReference: order.orderReference,
        status: order.status,
        currency: order.currency,
        quantity: order.quantity,
        grossAmount: parseFloat(order.grossAmount),
        discountAmount: parseFloat(order.discountAmount),
        taxAmount: parseFloat(order.taxAmount),
        finalAmount: parseFloat(order.finalAmount),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentProvider: order.paymentProvider,
        paymentReference: order.paymentReference,
        reservationExpiresAt: order.reservationExpiresAt,
        createdAt: order.createdAt,
      },
      event: {
        name: event.name,
        slug: event.slug,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        organizationName: org?.name || 'MS Backstage Event',
      },
      primaryTicketName: ticket?.name || 'Event Pass',
      attendees: docs.map((d) => ({
        attendeeId: d.attendeeId,
        name: d.attendeeName,
        registrationNumber: d.registrationNumber,
        category: d.category,
        ticketToken: d.ticketToken,
        downloadUrl: `/api/public/tickets/download/${d.ticketToken}`,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
