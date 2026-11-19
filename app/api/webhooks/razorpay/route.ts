import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import {
  paymentWebhookEvents,
  paymentTransactions,
  registrationOrders,
  eventTickets,
  attendees,
  registrationCounters,
  registrationAnswers,
  ticketDocuments,
  events,
} from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import {
  verifyRazorpayWebhookSignature,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from '@/lib/payments/razorpay';
import { confirmReservation, releaseReservation } from '@/lib/ticketing/inventory';
import {
  sendEmail,
  logEmailDelivery,
} from '@/lib/email/index';
import {
  paymentReceiptTemplate,
} from '@/lib/email/templates';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
 * POST /api/webhooks/razorpay
 * Dedicated webhook endpoint for Razorpay payment lifecycle notifications.
 * Verifies HMAC-SHA256 signature using raw payload body.
 * Guarantees idempotent execution and reconciliation.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // If webhook secret configured, strictly verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    let payload: Record<string, unknown> & {
      event_id?: string;
      id?: string;
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; error_description?: string } };
        order?: { entity?: { id?: string } };
      };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventId = payload.event_id || payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = payload.event || 'unknown';

    // 1. Idempotency Check
    if (isWebhookEventProcessed(eventId)) {
      return NextResponse.json({ status: 'ok', message: 'Event already processed' });
    }

    const [existingEvent] = await db
      .select({ id: paymentWebhookEvents.id })
      .from(paymentWebhookEvents)
      .where(eq(paymentWebhookEvents.gatewayEventId, eventId))
      .limit(1);

    if (existingEvent) {
      markWebhookEventProcessed(eventId);
      return NextResponse.json({ status: 'ok', message: 'Event already recorded' });
    }

    // Record webhook event
    const [recordedWebhook] = await db
      .insert(paymentWebhookEvents)
      .values({
        gatewayEventId: eventId,
        eventType,
        paymentProvider: 'razorpay',
        payload,
        processed: false,
      })
      .returning();

    markWebhookEventProcessed(eventId);

    // 2. Handle Payment Captured & Order Paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const gatewayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const gatewayPaymentId = paymentEntity.id;

      if (gatewayOrderId) {
        // Resolve matching payment transaction
        const [txRecord] = await db
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.gatewayOrderId, gatewayOrderId))
          .limit(1);

        if (txRecord) {
          const [order] = await db
            .select()
            .from(registrationOrders)
            .where(eq(registrationOrders.id, txRecord.orderId))
            .limit(1);

          if (order && order.status !== 'confirmed') {
            const [event] = await db
              .select()
              .from(events)
              .where(eq(events.id, order.eventId))
              .limit(1);

            const itemsPayload = ((txRecord.metadata as Record<string, unknown>)?.itemsPayload as Array<{
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

            await db.transaction(async (tx) => {
              // Confirm inventory reservation
              await confirmReservation(tx, { orderId: order.id });

              // Confirm order
              await tx
                .update(registrationOrders)
                .set({
                  status: 'confirmed',
                  paymentReference: gatewayPaymentId || order.paymentReference,
                  reservationExpiresAt: null,
                  updatedAt: new Date(),
                })
                .where(eq(registrationOrders.id, order.id));

              // Mark transaction captured
              await tx
                .update(paymentTransactions)
                .set({
                  status: 'captured',
                  gatewayPaymentId: gatewayPaymentId || txRecord.gatewayPaymentId,
                  updatedAt: new Date(),
                })
                .where(eq(paymentTransactions.id, txRecord.id));

              // Check existing attendees
              const existingDocs = await tx
                .select()
                .from(ticketDocuments)
                .where(eq(ticketDocuments.orderId, order.id));

              if (existingDocs.length === 0) {
                const createdAttendeeIds: string[] = [];

                for (const itemGroup of itemsPayload) {
                  const [ticket] = await tx
                    .select()
                    .from(eventTickets)
                    .where(eq(eventTickets.id, itemGroup.ticketId))
                    .limit(1);

                  const category = ticket?.category || 'Delegate';

                  for (const attData of itemGroup.attendees) {
                    const targetCounterKey = resolveCounterKey(category);
                    let [counter] = await tx
                      .select()
                      .from(registrationCounters)
                      .where(and(
                        eq(registrationCounters.eventId, order.eventId),
                        eq(registrationCounters.counterKey, targetCounterKey)
                      ))
                      .for('update')
                      .limit(1);

                    if (!counter) {
                      const prefix = (event?.slug || 'EVT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PASS';
                      const [createdCounter] = await tx
                        .insert(registrationCounters)
                        .values({
                          eventId: order.eventId,
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
                          eq(attendees.eventId, order.eventId),
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
                        eventId: order.eventId,
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
                        createdBy: 'razorpay_webhook',
                      })
                      .returning();

                    createdAttendeeIds.push(newAttendee.id);

                    // Dynamic answers
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

                    // Ticket Document
                    await tx.insert(ticketDocuments).values({
                      orderId: order.id,
                      attendeeId: newAttendee.id,
                      eventId: order.eventId,
                      ticketToken: crypto.randomUUID(),
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
              }
            });

            // Dispatch confirmation emails asynchronously
            (async () => {
              try {
                const receipt = paymentReceiptTemplate({
                  eventName: event?.name || 'Event',
                  orderId: order.orderNumber,
                  paymentId: gatewayPaymentId || 'PAID',
                  amount: Math.round(parseFloat(order.finalAmount) * 100),
                  currency: order.currency,
                  attendeeName: order.customerName,
                });

                await sendEmail({
                  to: order.customerEmail,
                  subject: receipt.subject,
                  html: receipt.html,
                  text: receipt.text,
                });

                await logEmailDelivery({
                  eventId: order.eventId,
                  orderId: order.id,
                  recipientEmail: order.customerEmail,
                  emailType: 'payment_receipt',
                  subject: receipt.subject,
                  status: 'sent',
                });
              } catch (e) {
                console.error('Webhook async email error:', e);
              }
            })();
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const gatewayOrderId = paymentEntity.order_id;
      const errorDesc = paymentEntity.error_description || 'Payment failed at gateway';

      if (gatewayOrderId) {
        const [txRecord] = await db
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.gatewayOrderId, gatewayOrderId))
          .limit(1);

        if (txRecord) {
          await db.transaction(async (tx) => {
            // Release inventory reservation
            await releaseReservation(tx, { orderId: txRecord.orderId, reason: 'failed' });

            await tx
              .update(paymentTransactions)
              .set({
                status: 'failed',
                errorMessage: errorDesc,
                updatedAt: new Date(),
              })
              .where(eq(paymentTransactions.id, txRecord.id));

            await tx
              .update(registrationOrders)
              .set({
                status: 'failed',
                notes: `[Payment Failed: ${errorDesc}]`,
                updatedAt: new Date(),
              })
              .where(eq(registrationOrders.id, txRecord.orderId));
          });
        }
      }
    }

    // Mark webhook processed
    await db
      .update(paymentWebhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(paymentWebhookEvents.id, recordedWebhook.id));

    return NextResponse.json({ status: 'ok', processed: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
