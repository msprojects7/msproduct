import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  events,
  eventTickets,
  ticketPriceRules,
  eventPromoCodes,
  promoCodeRedemptions,
  registrationOrders,
  registrationOrderItems,
  attendees,
  registrationCounters,
  registrationAnswers,
  paymentTransactions,
  ticketDocuments,
} from '@/db/schema/index';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { calculateTicketPricing } from '@/lib/ticketing/pricing';
import { reserveTicketInventory, confirmReservation } from '@/lib/ticketing/inventory';
import { createServerRazorpayOrder } from '@/lib/payments/razorpay';
import { checkAttendeeCapacity } from '@/lib/payments/capacity';
import {
  sendEmail,
  logEmailDelivery,
} from '@/lib/email/index';
import {
  digitalTicketDeliveryTemplate,
} from '@/lib/email/templates';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const attendeeItemSchema = z.object({
  name: z.string().trim().min(1, 'Attendee name is required').max(200),
  email: z.string().trim().email('Valid email required').max(255).optional().nullable().or(z.literal('')),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  gender: z.string().trim().max(50).optional().nullable(),
  foodPreference: z.string().trim().max(50).default('Not Specified'),
  medicalCouncilNumber: z.string().trim().max(100).optional().nullable(),
  answers: z.record(z.string(), z.any()).optional().default({}),
});

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Billing contact name is required').max(255),
  customerEmail: z.string().trim().email('Valid billing email is required').max(255),
  customerPhone: z.string().trim().max(50).optional().nullable(),
  promoCode: z.string().trim().optional().nullable(),
  items: z.array(z.object({
    ticketId: z.string().uuid('Invalid ticket ID'),
    attendees: z.array(attendeeItemSchema).min(1, 'At least 1 attendee required per ticket class'),
  })).min(1, 'At least one ticket class required'),
  notes: z.string().trim().optional().nullable(),
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
 * POST /api/public/events/[slug]/checkout
 * Public checkout endpoint supporting multi-attendee orders and atomic inventory reservation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout submission', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, customerPhone, promoCode, items, notes } = parsed.data;

    // 1. Resolve published event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);

    if (!event || event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event not found or not published' },
        { status: 404 }
      );
    }

    const totalAttendeesCount = items.reduce((acc, it) => acc + it.attendees.length, 0);
    if (totalAttendeesCount > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 attendees permitted per single order' },
        { status: 400 }
      );
    }

    // 2. Check Plan Attendee Capacity
    const capacityCheck = await checkAttendeeCapacity(event.organizationId, event.id, totalAttendeesCount);
    if (!capacityCheck.allowed) {
      return NextResponse.json(
        { error: capacityCheck.reason || 'Event capacity limit reached' },
        { status: 403 }
      );
    }

    // 3. Resolve all relevant tickets
    const ticketIds = items.map((i) => i.ticketId);
    const dbTickets = await db
      .select()
      .from(eventTickets)
      .where(and(
        eq(eventTickets.eventId, event.id),
        inArray(eventTickets.id, ticketIds)
      ));

    if (dbTickets.length !== ticketIds.length) {
      return NextResponse.json(
        { error: 'One or more selected tickets are invalid or do not belong to this event' },
        { status: 400 }
      );
    }

    // 4. Resolve Active Price Rules
    const activeRules = await db
      .select()
      .from(ticketPriceRules)
      .where(and(
        inArray(ticketPriceRules.ticketId, ticketIds),
        eq(ticketPriceRules.isActive, true)
      ));

    // 5. Resolve Promo Code if provided
    let promoRecord: typeof eventPromoCodes.$inferSelect | null = null;
    if (promoCode) {
      const [found] = await db
        .select()
        .from(eventPromoCodes)
        .where(and(
          eq(eventPromoCodes.eventId, event.id),
          sql`LOWER(${eventPromoCodes.code}) = LOWER(${promoCode.trim()})`,
          eq(eventPromoCodes.isActive, true)
        ))
        .limit(1);

      if (found) {
        promoRecord = found;
      }
    }

    // 6. Compute itemized line totals & authoritative server pricing
    let grandGross = 0;
    let grandDiscount = 0;
    let grandTax = 0;
    let grandFinal = 0;

    const lineItems: Array<{
      ticket: typeof dbTickets[0];
      quantity: number;
      pricing: ReturnType<typeof calculateTicketPricing>;
      attendees: typeof items[0]['attendees'];
    }> = [];

    for (const item of items) {
      const ticket = dbTickets.find((t) => t.id === item.ticketId)!;
      const quantity = item.attendees.length;

      if (quantity < ticket.minPerOrder || quantity > ticket.maxPerOrder) {
        return NextResponse.json(
          {
            error: `Pass "${ticket.name}" requires between ${ticket.minPerOrder} and ${ticket.maxPerOrder} passes per order.`,
          },
          { status: 400 }
        );
      }

      const rulesForTicket = activeRules
        .filter((r) => r.ticketId === ticket.id)
        .map((r) => ({
          ...r,
          discountValue: parseFloat(r.discountValue),
        }));

      const promoInput = promoRecord
        ? {
            id: promoRecord.id,
            code: promoRecord.code,
            discountType: promoRecord.discountType,
            discountValue: parseFloat(promoRecord.discountValue),
            applicableTicketIds: promoRecord.applicableTicketIds,
            minPurchaseAmount: parseFloat(promoRecord.minPurchaseAmount),
            maxTotalRedemptions: promoRecord.maxTotalRedemptions,
            currentRedemptions: promoRecord.currentRedemptions,
            maxRedemptionsPerUser: promoRecord.maxRedemptionsPerUser,
            validFrom: promoRecord.validFrom,
            validTo: promoRecord.validTo,
            isActive: promoRecord.isActive,
          }
        : null;

      const pricing = calculateTicketPricing({
        unitPrice: parseFloat(ticket.price),
        quantity,
        currency: ticket.currency,
        rules: rulesForTicket,
        promoCode: promoInput,
        ticketId: ticket.id,
      });

      grandGross += pricing.grossAmount;
      grandDiscount += pricing.totalDiscountAmount;
      grandTax += pricing.taxAmount;
      grandFinal += pricing.netPayableAmount;

      lineItems.push({
        ticket,
        quantity,
        pricing,
        attendees: item.attendees,
      });
    }

    // Round amounts to 2 decimal places
    grandGross = Math.round(grandGross * 100) / 100;
    grandDiscount = Math.round(grandDiscount * 100) / 100;
    grandTax = Math.round(grandTax * 100) / 100;
    grandFinal = Math.max(0, Math.round(grandFinal * 100) / 100);

    const isFreeOrder = grandFinal === 0;

    // 7. Atomic Transaction: Reserve Inventory & Create Order
    const result = await db.transaction(async (tx) => {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderReference = crypto.randomUUID();

      // Preliminary insertion of Order record
      const primaryTicket = lineItems[0].ticket;
      const [order] = await tx
        .insert(registrationOrders)
        .values({
          eventId: event.id,
          orderNumber,
          orderReference,
          ticketId: primaryTicket.id, // For Stage 2 backward compatibility
          promoCodeId: promoRecord?.id || null,
          status: isFreeOrder ? 'confirmed' : 'pending_payment',
          currency: primaryTicket.currency || 'INR',
          unitPrice: String(primaryTicket.price),
          quantity: totalAttendeesCount,
          grossAmount: String(grandGross),
          discountAmount: String(grandDiscount),
          taxAmount: String(grandTax),
          finalAmount: String(grandFinal),
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          paymentProvider: isFreeOrder ? 'free' : 'razorpay',
          paymentReference: isFreeOrder ? 'FREE_PASS' : null,
          notes: notes || null,
          reservationExpiresAt: isFreeOrder ? null : new Date(Date.now() + 15 * 60 * 1000), // 15 mins reservation TTL
        })
        .returning();

      // Reserve Inventory
      const reservationItems = lineItems.map((li) => ({
        ticketId: li.ticket.id,
        quantity: li.quantity,
      }));

      const reserveStatus = await reserveTicketInventory(tx, {
        orderId: order.id,
        eventId: event.id,
        items: reservationItems,
        reservationMinutes: 15,
      });

      if (!reserveStatus.success) {
        throw new Error(reserveStatus.error || 'Failed to reserve ticket inventory');
      }

      // Record itemized lines
      for (const line of lineItems) {
        await tx.insert(registrationOrderItems).values({
          orderId: order.id,
          eventId: event.id,
          ticketId: line.ticket.id,
          quantity: line.quantity,
          unitPrice: String(line.pricing.unitPrice),
          subtotal: String(line.pricing.grossAmount),
          discountAmount: String(line.pricing.totalDiscountAmount),
          taxAmount: String(line.pricing.taxAmount),
          finalAmount: String(line.pricing.netPayableAmount),
        });
      }

      // If Promo Code applied, increment usage
      if (promoRecord) {
        await tx
          .update(eventPromoCodes)
          .set({
            currentRedemptions: sql`${eventPromoCodes.currentRedemptions} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(eventPromoCodes.id, promoRecord.id));

        await tx.insert(promoCodeRedemptions).values({
          promoCodeId: promoRecord.id,
          eventId: event.id,
          orderId: order.id,
          attendeeEmail: customerEmail,
          discountApplied: String(grandDiscount),
        });
      }

      // If Free Order: Instantly confirm reservations, generate attendee records, QR tokens, and tickets
      if (isFreeOrder) {
        await confirmReservation(tx, { orderId: order.id });

        const createdAttendeeIds: string[] = [];

        for (const line of lineItems) {
          for (const attData of line.attendees) {
            // Allocate sequential registration number
            const targetCounterKey = resolveCounterKey(line.ticket.category || 'Delegate');
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
                  displayName: `${line.ticket.category} Counter`,
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
                category: line.ticket.category || 'Delegate',
                phoneNumber: attData.phoneNumber || customerPhone || null,
                email: attData.email || customerEmail,
                gender: attData.gender || null,
                medicalCouncilNumber: attData.medicalCouncilNumber || null,
                foodPreference: attData.foodPreference || 'Not Specified',
                paymentStatus: 'Paid',
                registrationType: 'pre_registered',
                attendanceStatus: 'not_checked_in',
                qrToken,
                createdBy: 'public_portal',
              })
              .returning();

            createdAttendeeIds.push(newAttendee.id);

            // Record dynamic answers if any
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

            // Issue ticket document record
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

        // Link primary attendee to order
        if (createdAttendeeIds.length > 0) {
          await tx
            .update(registrationOrders)
            .set({ attendeeId: createdAttendeeIds[0] })
            .where(eq(registrationOrders.id, order.id));
        }
      }

      return {
        order,
        orderReference,
        orderNumber,
        isFreeOrder,
        grandFinal,
      };
    });

    // 8. If Free: Trigger asynchronous email delivery
    if (result.isFreeOrder) {
      (async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const confirmUrl = `${appUrl}/p/${slug}/confirmation/${result.orderReference}`;

          // Dispatch attendee email
          const attendeeEmailContent = digitalTicketDeliveryTemplate({
            eventName: event.name,
            attendeeName: customerName,
            registrationNumber: result.orderNumber,
            category: lineItems[0].ticket.category || 'Delegate',
            ticketName: lineItems[0].ticket.name,
            ticketDownloadUrl: confirmUrl,
            venue: event.venue,
            date: event.startDate ? new Date(event.startDate).toDateString() : undefined,
            orderReference: result.orderReference,
          });

          await sendEmail({
            to: customerEmail,
            subject: attendeeEmailContent.subject,
            html: attendeeEmailContent.html,
            text: attendeeEmailContent.text,
          });

          await logEmailDelivery({
            eventId: event.id,
            orderId: result.order.id,
            recipientEmail: customerEmail,
            emailType: 'registration_confirmation',
            subject: attendeeEmailContent.subject,
            status: 'sent',
          });
        } catch (e) {
          console.error('Async email dispatch error:', e);
        }
      })();

      return NextResponse.json({
        success: true,
        isFree: true,
        orderReference: result.orderReference,
        orderNumber: result.orderNumber,
        message: 'Registration confirmed successfully',
      });
    }

    // 9. If Paid: Create Razorpay Order on server
    const rzpOrder = await createServerRazorpayOrder({
      amount: Math.round(grandFinal * 100), // In paise
      currency: 'INR',
      receipt: result.orderNumber,
      notes: {
        orderReference: result.orderReference,
        eventId: event.id,
        eventSlug: event.slug,
        customerEmail,
      },
    });

    if (!rzpOrder) {
      return NextResponse.json(
        { error: 'Failed to initiate gateway payment order. Please try again.' },
        { status: 502 }
      );
    }

    // Record transaction with line item details for verification reconciliation
    await db.insert(paymentTransactions).values({
      orderId: result.order.id,
      eventId: event.id,
      paymentProvider: 'razorpay',
      gatewayOrderId: rzpOrder.id,
      amount: String(grandFinal),
      currency: 'INR',
      status: 'created',
      metadata: {
        receipt: result.orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        itemsPayload: items,
      },
    });

    return NextResponse.json({
      success: true,
      isFree: false,
      orderReference: result.orderReference,
      orderNumber: result.orderNumber,
      razorpay: {
        orderId: rzpOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback_key',
        amount: Math.round(grandFinal * 100),
        currency: 'INR',
        name: event.name,
        description: `Passes for ${event.name} (${totalAttendeesCount} attendee${totalAttendeesCount > 1 ? 's' : ''})`,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone || '',
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
