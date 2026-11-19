import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  registrationOrders,
  registrationAnswers,
  registrationFormFields,
  eventTickets,
  attendees,
  eventPromoCodes,
  ticketDocuments,
} from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z.enum(['draft', 'pending_payment', 'confirmed', 'cancelled', 'failed', 'refunded']).optional(),
  notes: z.string().trim().optional().nullable(),
});

/**
 * GET /api/events/[eventId]/registrations/[orderId]
 * Retrieves comprehensive order details, financial summary, attendee link, and dynamic form answers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; orderId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_registrations');

    const [order] = await db
      .select({
        id: registrationOrders.id,
        eventId: registrationOrders.eventId,
        orderNumber: registrationOrders.orderNumber,
        orderReference: registrationOrders.orderReference,
        status: registrationOrders.status,
        currency: registrationOrders.currency,
        unitPrice: registrationOrders.unitPrice,
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
        notes: registrationOrders.notes,
        createdAt: registrationOrders.createdAt,
        updatedAt: registrationOrders.updatedAt,
        ticketId: registrationOrders.ticketId,
        ticketName: eventTickets.name,
        ticketCategory: eventTickets.category,
        attendeeId: registrationOrders.attendeeId,
        attendeeRegNo: attendees.registrationNumber,
        attendeeName: attendees.name,
        attendeeEmail: attendees.email,
        attendeePaymentStatus: attendees.paymentStatus,
        attendeeAttendanceStatus: attendees.attendanceStatus,
        promoCode: eventPromoCodes.code,
      })
      .from(registrationOrders)
      .innerJoin(eventTickets, eq(registrationOrders.ticketId, eventTickets.id))
      .leftJoin(attendees, eq(registrationOrders.attendeeId, attendees.id))
      .leftJoin(eventPromoCodes, eq(registrationOrders.promoCodeId, eventPromoCodes.id))
      .where(and(
        eq(registrationOrders.id, params.orderId),
        eq(registrationOrders.eventId, context.event.id)
      ))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch dynamic form answers
    const answers = await db
      .select({
        id: registrationAnswers.id,
        fieldId: registrationAnswers.fieldId,
        fieldKey: registrationAnswers.fieldKey,
        fieldLabel: registrationFormFields.fieldLabel,
        fieldType: registrationFormFields.fieldType,
        answerValue: registrationAnswers.answerValue,
      })
      .from(registrationAnswers)
      .leftJoin(registrationFormFields, eq(registrationAnswers.fieldId, registrationFormFields.id))
      .where(eq(registrationAnswers.orderId, order.id));

    // Fetch all attendees associated with this order (including multi-attendee orders)
    const orderAttendees = await db
      .select({
        id: attendees.id,
        name: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
        email: attendees.email,
        phoneNumber: attendees.phoneNumber,
        attendanceStatus: attendees.attendanceStatus,
        paymentStatus: attendees.paymentStatus,
        ticketToken: ticketDocuments.ticketToken,
      })
      .from(ticketDocuments)
      .innerJoin(attendees, eq(ticketDocuments.attendeeId, attendees.id))
      .where(eq(ticketDocuments.orderId, order.id));

    return NextResponse.json({
      status: 'ok',
      order: {
        ...order,
        answers,
        attendees: orderAttendees,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/events/[eventId]/registrations/[orderId]
 * Updates order status (e.g. Cancel order, release/restore inventory).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; orderId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_tickets');

    const [order] = await db
      .select()
      .from(registrationOrders)
      .where(and(
        eq(registrationOrders.id, params.orderId),
        eq(registrationOrders.eventId, context.event.id)
      ))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;

    // Handle inventory adjustment if order cancelled
    await db.transaction(async (tx) => {
      if (status && status !== order.status) {
        if (status === 'cancelled' || status === 'refunded') {
          // Release inventory
          const [ticket] = await tx
            .select()
            .from(eventTickets)
            .where(eq(eventTickets.id, order.ticketId))
            .for('update')
            .limit(1);

          if (ticket) {
            if (order.status === 'confirmed') {
              await tx
                .update(eventTickets)
                .set({
                  soldQuantity: Math.max(0, ticket.soldQuantity - order.quantity),
                  updatedAt: new Date(),
                })
                .where(eq(eventTickets.id, ticket.id));
            } else if (order.status === 'pending_payment') {
              await tx
                .update(eventTickets)
                .set({
                  reservedQuantity: Math.max(0, ticket.reservedQuantity - order.quantity),
                  updatedAt: new Date(),
                })
                .where(eq(eventTickets.id, ticket.id));
            }
          }

          // If linked to attendee, update attendee paymentStatus
          if (order.attendeeId) {
            await tx
              .update(attendees)
              .set({
                paymentStatus: status === 'refunded' ? 'Refunded' : 'Cancelled',
                updatedAt: new Date(),
              })
              .where(eq(attendees.id, order.attendeeId));
          }
        }
      }

      await tx
        .update(registrationOrders)
        .set({
          status: status || order.status,
          notes: notes !== undefined ? notes : order.notes,
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.id, order.id));
    });

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'order.update_status',
      entityType: 'order',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus: status || order.status,
      },
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Order updated successfully',
      newStatus: status || order.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
