import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  registrationOrders,
  paymentTransactions,
  events,
} from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { createServerRazorpayOrder } from '@/lib/payments/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/orders/[orderReference]/retry
 * Allows retrying payment on an unexpired or failed order without creating duplicate attendees or orders.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderReference: string } }
) {
  try {
    const orderReference = params.orderReference;
    if (!orderReference) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(registrationOrders)
      .where(eq(registrationOrders.orderReference, orderReference))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Order is already confirmed and paid' },
        { status: 400 }
      );
    }

    if (order.reservationExpiresAt && new Date(order.reservationExpiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'Your ticket reservation has expired. Please select your passes again to check out.',
          code: 'RESERVATION_EXPIRED',
        },
        { status: 410 }
      );
    }

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1);

    const finalAmount = parseFloat(order.finalAmount);

    // Create fresh gateway order
    const rzpOrder = await createServerRazorpayOrder({
      amount: Math.round(finalAmount * 100),
      currency: order.currency || 'INR',
      receipt: `${order.orderNumber}-R`,
      notes: {
        orderReference: order.orderReference!,
        eventId: event.id,
        eventSlug: event.slug,
        customerEmail: order.customerEmail,
      },
    });

    if (!rzpOrder) {
      return NextResponse.json(
        { error: 'Failed to initiate gateway order retry. Please try again.' },
        { status: 502 }
      );
    }

    // Record new transaction attempt
    await db.insert(paymentTransactions).values({
      orderId: order.id,
      eventId: order.eventId,
      paymentProvider: 'razorpay',
      gatewayOrderId: rzpOrder.id,
      amount: String(finalAmount),
      currency: order.currency || 'INR',
      status: 'created',
      metadata: { receipt: order.orderNumber, isRetry: true },
    });

    // Reset order status to pending_payment
    await db
      .update(registrationOrders)
      .set({
        status: 'pending_payment',
        updatedAt: new Date(),
      })
      .where(eq(registrationOrders.id, order.id));

    return NextResponse.json({
      success: true,
      orderReference: order.orderReference,
      orderNumber: order.orderNumber,
      razorpay: {
        orderId: rzpOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback_key',
        amount: Math.round(finalAmount * 100),
        currency: order.currency || 'INR',
        name: event.name,
        description: `Retry Payment for ${order.orderNumber}`,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone || '',
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
