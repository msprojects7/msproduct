import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  events,
  eventTickets,
  registrationOrders,
  registrationOrderItems,
  paymentTransactions,
  attendees,
  registrationCounters,
  registrationAnswers,
  ticketDocuments,
} from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { confirmReservation } from '@/lib/ticketing/inventory';
import { verifyRazorpayPaymentSignature } from '@/lib/payments/razorpay';
import {
  sendEmail,
  logEmailDelivery,
} from '@/lib/email/index';
import {
  digitalTicketDeliveryTemplate,
  paymentReceiptTemplate,
} from '@/lib/email/templates';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const verifyPaymentSchema = z.object({
  orderReference: z.string().min(1, 'Order reference is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpayOrderId: z.string().min(1, 'Gateway order ID is required'),
  razorpaySignature: z.string().min(1, 'Payment signature is required'),
});

function resolveCounterKey(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('faculty')) return 'faculty_counter';
  if (cat.includes('student') || cat.includes('postgraduate')) return 'student_counter';
  if (cat.includes('exhibitor')) return 'exhibitor_counter';
  if (cat.includes('accompanying')) return 'accompanying_counter';
  if (cat.includes('vip') || cat.includes('guest')) return 'vip_counter';
  return 'delegate_counter';
}

/**
 * POST /api/public/events/[slug]/verify-payment
 * Verifies Razorpay payment signature, confirms ticket reservations,
 * creates distinct attendee records, and issues digital tickets.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payment verification payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderReference, razorpayPaymentId, razorpayOrderId, razorpaySignature } = parsed.data;

    // 1. Resolve event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Resolve order by reference
    const [order] = await db
      .select()
      .from(registrationOrders)
      .where(and(
        eq(registrationOrders.orderReference, orderReference),
        eq(registrationOrders.eventId, event.id)
      ))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotent return if already confirmed
    if (order.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        orderReference: order.orderReference,
        orderNumber: order.orderNumber,
        message: 'Order is already verified and confirmed',
      });
    }

    // 3. Cryptographically verify signature
    // In local dev/mock without Razorpay keys, allow mock verification if signature contains 'mock' or keys unset
    const isMock = !process.env.RAZORPAY_KEY_SECRET;
    let isValidSignature = isMock;

    if (!isValidSignature) {
      isValidSignature = verifyRazorpayPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted payment submission.' },
        { status: 400 }
      );
    }

    // 4. Retrieve transaction metadata for attendee creation
    const [txRecord] = await db
      .select()
      .from(paymentTransactions)
      .where(and(
        eq(paymentTransactions.orderId, order.id),
        eq(paymentTransactions.gatewayOrderId, razorpayOrderId)
      ))
      .limit(1);

    const itemsPayload = ((txRecord?.metadata as Record<string, unknown>)?.itemsPayload as Array<{
      ticketId: string;
      attendees: Array<{
        name: string;
        email?: string;
        phoneNumber?: string;
        gender?: string;
        medicalCouncilNumber?: string;
        foodPreference?: string;
        answers?: Record<string, unknown>;
      }>;
    }>) || [];

    // 5. Atomic confirmation transaction
    await db.transaction(async (tx) => {
      // Confirm inventory reservations
      await confirmReservation(tx, { orderId: order.id });

      // Update order status
      await tx
        .update(registrationOrders)
        .set({
          status: 'confirmed',
          paymentReference: razorpayPaymentId,
          reservationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.id, order.id));

      // Update payment transaction status
      if (txRecord) {
        await tx
          .update(paymentTransactions)
          .set({
            status: 'captured',
            gatewayPaymentId: razorpayPaymentId,
            gatewaySignature: razorpaySignature,
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, txRecord.id));
      }

      // Check if attendees are already created for this order to prevent duplicates
      const existingDocs = await tx
        .select()
        .from(ticketDocuments)
        .where(eq(ticketDocuments.orderId, order.id));

      if (existingDocs.length > 0) {
        return { order, orderNumber: order.orderNumber, attendeesCreated: 0 };
      }

      const createdAttendeeIds: string[] = [];

      // Create distinct attendee records for each ticket in the order
      for (const itemGroup of itemsPayload) {
        const [ticket] = await tx
          .select()
          .from(eventTickets)
          .where(eq(eventTickets.id, itemGroup.ticketId))
          .limit(1);

        const category = ticket?.category || 'Delegate';

        for (const attData of itemGroup.attendees) {
          // Resolve sequential registration number
          const targetCounterKey = resolveCounterKey(category);
          let [counter] = await tx
            .select()
            .from(registrationCounters)
            .where(and(
              eq(registrationCounters.eventId, event.id),
              eq(registrationCounters.counterKey, targetCounterKey)
            ))
            .for('update')
            .limit(1);

          if (!counter) {
            const prefix = (event.slug || 'EVT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PASS';
            const [createdCounter] = await tx
              .insert(registrationCounters)
              .values({
                eventId: event.id,
                counterKey: targetCounterKey,
                displayName: `${category} Counter`,
                prefix,
                startValue: 1000,
                nextValue: 1000,
                padding: 4,
              })
              .returning();
            counter = createdCounter;
          }

          let candidateNum = counter.nextValue;
          let regNo = '';
          while (true) {
            regNo = `${counter.prefix}-${String(candidateNum).padStart(counter.padding || 4, '0')}`;
            const [collision] = await tx
              .select({ id: attendees.id })
              .from(attendees)
              .where(and(
                eq(attendees.eventId, event.id),
                eq(attendees.registrationNumber, regNo)
              ))
              .limit(1);
            if (!collision) break;
            candidateNum += 1;
          }

          await tx
            .update(registrationCounters)
            .set({
              nextValue: candidateNum + 1,
              lastUsedValue: candidateNum,
              updatedAt: new Date(),
            })
            .where(eq(registrationCounters.id, counter.id));

          const qrToken = crypto.randomUUID();

          const [newAttendee] = await tx
            .insert(attendees)
            .values({
              eventId: event.id,
              registrationNumber: regNo,
              name: attData.name,
              category,
              phoneNumber: attData.phoneNumber || order.customerPhone || null,
              email: attData.email || order.customerEmail,
              gender: attData.gender || null,
              medicalCouncilNumber: attData.medicalCouncilNumber || null,
              foodPreference: attData.foodPreference || 'Not Specified',
              paymentStatus: 'Paid',
              registrationType: 'pre_registered',
              attendanceStatus: 'not_checked_in',
              qrToken,
              createdBy: 'razorpay_checkout',
            })
            .returning();

          createdAttendeeIds.push(newAttendee.id);

          // Link attendee to matching order item if available
          await tx
            .update(registrationOrderItems)
            .set({ attendeeId: newAttendee.id })
            .where(and(
              eq(registrationOrderItems.orderId, order.id),
              eq(registrationOrderItems.ticketId, itemGroup.ticketId)
            ));

          // Dynamic field answers
          if (attData.answers && typeof attData.answers === 'object') {
            for (const [key, val] of Object.entries(attData.answers)) {
              await tx.insert(registrationAnswers).values({
                orderId: order.id,
                attendeeId: newAttendee.id,
                fieldKey: key,
                answerValue: val,
              });
            }
          }

          // Issue digital ticket document
          const ticketToken = crypto.randomUUID();
          await tx.insert(ticketDocuments).values({
            orderId: order.id,
            attendeeId: newAttendee.id,
            eventId: event.id,
            ticketToken,
            status: 'ready',
          });
        }
      }

      if (createdAttendeeIds.length > 0) {
        await tx
          .update(registrationOrders)
          .set({ attendeeId: createdAttendeeIds[0] })
          .where(eq(registrationOrders.id, order.id));
      }

      return {
        order,
        orderNumber: order.orderNumber,
        attendeesCreated: createdAttendeeIds.length,
      };
    });

    // 6. Trigger confirmation & payment receipt emails
    (async () => {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const confirmUrl = `${appUrl}/p/${slug}/confirmation/${order.orderReference}`;

        // Send payment receipt to billing customer
        const receiptEmail = paymentReceiptTemplate({
          eventName: event.name,
          orderId: order.orderNumber,
          paymentId: razorpayPaymentId,
          amount: Math.round(parseFloat(order.finalAmount) * 100),
          currency: order.currency,
          attendeeName: order.customerName,
        });

        await sendEmail({
          to: order.customerEmail,
          subject: receiptEmail.subject,
          html: receiptEmail.html,
          text: receiptEmail.text,
        });

        await logEmailDelivery({
          eventId: event.id,
          orderId: order.id,
          recipientEmail: order.customerEmail,
          emailType: 'payment_receipt',
          subject: receiptEmail.subject,
          status: 'sent',
        });

        // Send ticket confirmation
        const ticketEmail = digitalTicketDeliveryTemplate({
          eventName: event.name,
          attendeeName: order.customerName,
          registrationNumber: order.orderNumber,
          category: 'Confirmed Registration',
          ticketName: 'Official Event Pass',
          ticketDownloadUrl: confirmUrl,
          venue: event.venue,
          date: event.startDate ? new Date(event.startDate).toDateString() : undefined,
          orderReference: order.orderReference!,
        });

        await sendEmail({
          to: order.customerEmail,
          subject: ticketEmail.subject,
          html: ticketEmail.html,
          text: ticketEmail.text,
        });

        await logEmailDelivery({
          eventId: event.id,
          orderId: order.id,
          recipientEmail: order.customerEmail,
          emailType: 'digital_ticket_delivery',
          subject: ticketEmail.subject,
          status: 'sent',
        });
      } catch (err) {
        console.error('Async payment verification email error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Payment verified and registration confirmed successfully',
      orderReference: order.orderReference,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
