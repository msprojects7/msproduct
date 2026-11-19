import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  eventTickets,
  ticketPriceRules,
  eventPromoCodes,
  promoCodeRedemptions,
  registrationForms,
  registrationFormFields,
  registrationOrders,
  registrationAnswers,
  attendees,
  registrationCounters,
} from '@/db/schema/index';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { calculateTicketPricing } from '@/lib/ticketing/pricing';
import { recordAuditEvent } from '@/lib/audit';
import { checkAttendeeCapacity } from '@/lib/payments/capacity';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const submitRegistrationSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
  quantity: z.number().int().min(1).max(10).default(1),
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Valid email is required').max(255),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  promoCode: z.string().trim().optional().nullable(),
  answers: z.record(z.string(), z.any()).optional().default({}),
  notes: z.string().trim().optional().nullable(),
});

/**
 * Resolves category to a counter key in registration_counters.
 */
function resolveCounterKey(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('faculty')) return 'faculty_counter';
  if (cat.includes('postgraduate') || cat.includes('student')) return 'student_counter';
  if (cat.includes('exhibitor')) return 'exhibitor_counter';
  if (cat.includes('accompanying')) return 'accompanying_counter';
  if (cat.includes('vip') || cat.includes('guest')) return 'vip_counter';
  return 'delegate_counter';
}

/**
 * GET /api/events/[eventId]/registrations
 * Lists all registration orders for the event with search and status filtering.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_registrations');

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('q');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const query = db
      .select({
        id: registrationOrders.id,
        orderNumber: registrationOrders.orderNumber,
        status: registrationOrders.status,
        currency: registrationOrders.currency,
        unitPrice: registrationOrders.unitPrice,
        quantity: registrationOrders.quantity,
        grossAmount: registrationOrders.grossAmount,
        discountAmount: registrationOrders.discountAmount,
        finalAmount: registrationOrders.finalAmount,
        customerName: registrationOrders.customerName,
        customerEmail: registrationOrders.customerEmail,
        customerPhone: registrationOrders.customerPhone,
        paymentProvider: registrationOrders.paymentProvider,
        createdAt: registrationOrders.createdAt,
        ticketId: registrationOrders.ticketId,
        ticketName: eventTickets.name,
        ticketCategory: eventTickets.category,
        attendeeId: registrationOrders.attendeeId,
        attendeeRegNo: attendees.registrationNumber,
        attendeeAttendanceStatus: attendees.attendanceStatus,
        promoCode: eventPromoCodes.code,
      })
      .from(registrationOrders)
      .innerJoin(eventTickets, eq(registrationOrders.ticketId, eventTickets.id))
      .leftJoin(attendees, eq(registrationOrders.attendeeId, attendees.id))
      .leftJoin(eventPromoCodes, eq(registrationOrders.promoCodeId, eventPromoCodes.id))
      .where(and(
        eq(registrationOrders.eventId, context.event.id),
        statusFilter ? eq(registrationOrders.status, statusFilter) : undefined,
        searchQuery ? sql`(${registrationOrders.customerName} ILIKE ${`%${searchQuery}%`} OR ${registrationOrders.customerEmail} ILIKE ${`%${searchQuery}%`} OR ${registrationOrders.orderNumber} ILIKE ${`%${searchQuery}%`})` : undefined
      ))
      .orderBy(desc(registrationOrders.createdAt))
      .limit(limit)
      .offset(offset);

    const orders = await query;

    return NextResponse.json({
      status: 'ok',
      orders,
      limit,
      offset,
      returnedCount: orders.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/registrations
 * Atomically creates a registration order, calculates server-side pricing,
 * validates promo codes, reserves/updates ticket inventory, registers attendee,
 * and records custom form answers.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    // Organizers, staff, and future checkout engine can register
    context.assertPermission('event:create_attendee');

    const body = await request.json().catch(() => null);
    const parsed = submitRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      ticketId,
      quantity,
      name,
      email,
      phoneNumber,
      category: explicitCategory,
      promoCode: promoCodeStr,
      answers,
      notes,
    } = parsed.data;

    // 1. Check organization SaaS plan capacity
    const capacityCheck = await checkAttendeeCapacity(context.organization.id, context.event.id, quantity);
    if (!capacityCheck.allowed) {
      return NextResponse.json(
        {
          error: capacityCheck.reason || 'Organization attendee capacity limit reached',
          code: 'CAPACITY_LIMIT_EXCEEDED',
          details: capacityCheck,
        },
        { status: 403 }
      );
    }

    // 2. Fetch Form Fields for validation
    const [form] = await db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.eventId, context.event.id))
      .limit(1);

    const formFields = form
      ? await db
          .select()
          .from(registrationFormFields)
          .where(eq(registrationFormFields.formId, form.id))
      : [];

    // Validate required form fields
    for (const field of formFields) {
      if (field.isRequired && field.isVisible) {
        // Skip name, email, phone if passed top-level
        if (field.fieldKey === 'name' && name) continue;
        if (field.fieldKey === 'email' && email) continue;
        if (field.fieldKey === 'phoneNumber' && phoneNumber) continue;

        const val = answers[field.fieldKey];
        if (val === undefined || val === null || val === '') {
          return NextResponse.json(
            { error: `Missing required field: ${field.fieldLabel}`, fieldKey: field.fieldKey },
            { status: 400 }
          );
        }
      }
    }

    // 3. Atomic Database Transaction for Inventory, Order & Attendee Creation
    const result = await db.transaction(async (tx) => {
      // 3a. Lock ticket row for update
      const [ticket] = await tx
        .select()
        .from(eventTickets)
        .where(and(eq(eventTickets.id, ticketId), eq(eventTickets.eventId, context.event.id)))
        .for('update')
        .limit(1);

      if (!ticket) {
        throw new Error('TICKET_NOT_FOUND');
      }

      // Check status & sale window
      const now = new Date();
      if (ticket.status === 'paused' || ticket.status === 'closed') {
        throw new Error('TICKET_SALES_CLOSED');
      }
      if (ticket.salesStart && new Date(ticket.salesStart) > now) {
        throw new Error('TICKET_SALES_NOT_STARTED');
      }
      if (ticket.salesEnd && new Date(ticket.salesEnd) < now) {
        throw new Error('TICKET_SALES_EXPIRED');
      }

      // Check purchase limits
      if (quantity < ticket.minPerOrder) {
        throw new Error(`Minimum purchase is ${ticket.minPerOrder} ticket(s)`);
      }
      if (quantity > ticket.maxPerOrder) {
        throw new Error(`Maximum purchase is ${ticket.maxPerOrder} ticket(s) per order`);
      }

      // Check inventory
      const available = ticket.totalQuantity - ticket.soldQuantity - ticket.reservedQuantity;
      if (available < quantity) {
        throw new Error(`Only ${Math.max(0, available)} ticket(s) available in this category`);
      }

      // 3b. Fetch ticket price rules
      const priceRules = await tx
        .select()
        .from(ticketPriceRules)
        .where(and(eq(ticketPriceRules.ticketId, ticket.id), eq(ticketPriceRules.isActive, true)));

      // 3c. Fetch and validate promo code if provided
      let promoCodeEntity: typeof eventPromoCodes.$inferSelect | null = null;
      let userRedemptionCount = 0;

      if (promoCodeStr) {
        const [foundPromo] = await tx
          .select()
          .from(eventPromoCodes)
          .where(and(
            eq(eventPromoCodes.eventId, context.event.id),
            ilike(eventPromoCodes.code, promoCodeStr.trim())
          ))
          .for('update')
          .limit(1);

        if (!foundPromo) {
          throw new Error(`Promo code '${promoCodeStr}' not found`);
        }
        if (!foundPromo.isActive) {
          throw new Error('Promo code is currently disabled');
        }
        if (foundPromo.validFrom && new Date(foundPromo.validFrom) > now) {
          throw new Error('Promo code is not yet active');
        }
        if (foundPromo.validTo && new Date(foundPromo.validTo) < now) {
          throw new Error('Promo code has expired');
        }
        if (foundPromo.maxTotalRedemptions && foundPromo.currentRedemptions >= foundPromo.maxTotalRedemptions) {
          throw new Error('Promo code has reached maximum usage limit');
        }

        const redemptions = await tx
          .select()
          .from(promoCodeRedemptions)
          .where(and(
            eq(promoCodeRedemptions.promoCodeId, foundPromo.id),
            eq(promoCodeRedemptions.attendeeEmail, email.toLowerCase())
          ));
        userRedemptionCount = redemptions.length;

        if (foundPromo.maxRedemptionsPerUser && userRedemptionCount >= foundPromo.maxRedemptionsPerUser) {
          throw new Error('You have already used this promo code the maximum allowed times');
        }

        promoCodeEntity = foundPromo;
      }

      // 3d. Calculate exact server-side pricing
      const pricing = calculateTicketPricing({
        unitPrice: Number(ticket.price),
        quantity,
        currency: ticket.currency,
        rules: priceRules,
        promoCode: promoCodeEntity,
        ticketId: ticket.id,
        userRedemptionCount,
      });

      // 3e. Determine status and inventory allocation
      const isConfirmed = pricing.isFree || pricing.netPayableAmount === 0;
      const orderStatus: 'confirmed' | 'pending_payment' = isConfirmed ? 'confirmed' : 'pending_payment';
      const paymentProvider = isConfirmed ? 'free' : 'none';

      // Update ticket inventory
      if (isConfirmed) {
        await tx
          .update(eventTickets)
          .set({
            soldQuantity: ticket.soldQuantity + quantity,
            updatedAt: new Date(),
          })
          .where(eq(eventTickets.id, ticket.id));
      } else {
        await tx
          .update(eventTickets)
          .set({
            reservedQuantity: ticket.reservedQuantity + quantity,
            updatedAt: new Date(),
          })
          .where(eq(eventTickets.id, ticket.id));
      }

      // If promo code applied, increment current redemptions
      if (pricing.appliedPromo && promoCodeEntity) {
        await tx
          .update(eventPromoCodes)
          .set({
            currentRedemptions: promoCodeEntity.currentRedemptions + 1,
            updatedAt: new Date(),
          })
          .where(eq(eventPromoCodes.id, promoCodeEntity.id));
      }

      // 3f. Sequential Registration Number Generation for Attendee
      const attendeeCategory = explicitCategory || ticket.category || 'Delegate';
      const counterKey = resolveCounterKey(attendeeCategory);

      let [counter] = await tx
        .select()
        .from(registrationCounters)
        .where(and(
          eq(registrationCounters.eventId, context.event.id),
          eq(registrationCounters.counterKey, counterKey)
        ))
        .for('update')
        .limit(1);

      if (!counter) {
        [counter] = await tx
          .select()
          .from(registrationCounters)
          .where(and(
            eq(registrationCounters.eventId, context.event.id),
            eq(registrationCounters.counterKey, 'delegate_counter')
          ))
          .for('update')
          .limit(1);
      }

      if (!counter) {
        const prefix = (context.event.slug || 'REG')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8) || 'REG';

        const [createdCounter] = await tx
          .insert(registrationCounters)
          .values({
            eventId: context.event.id,
            counterKey,
            displayName: `${attendeeCategory} Counter`,
            prefix,
            startValue: 1000,
            nextValue: 1000,
            padding: 4,
            lastUsedValue: null,
          })
          .returning();

        counter = createdCounter;
      }

      let candidateNumber = counter.nextValue;
      let regNo = '';

      while (true) {
        regNo = `${counter.prefix}-${String(candidateNumber).padStart(counter.padding || 4, '0')}`;
        const [collision] = await tx
          .select({ id: attendees.id })
          .from(attendees)
          .where(and(eq(attendees.eventId, context.event.id), eq(attendees.registrationNumber, regNo)))
          .limit(1);

        if (!collision) break;
        candidateNumber++;
      }

      // Update counter
      await tx
        .update(registrationCounters)
        .set({
          nextValue: candidateNumber + 1,
          lastUsedValue: candidateNumber,
          updatedAt: new Date(),
        })
        .where(eq(registrationCounters.id, counter.id));

      // 3g. Create attendee record in existing attendees table!
      const [createdAttendee] = await tx
        .insert(attendees)
        .values({
          eventId: context.event.id,
          registrationNumber: regNo,
          name,
          category: attendeeCategory,
          phoneNumber: phoneNumber || null,
          email: email.toLowerCase(),
          foodPreference: typeof answers.foodPreference === 'string' ? answers.foodPreference : 'Not Specified',
          paymentStatus: isConfirmed ? 'Paid' : 'Pending',
          registrationType: 'pre_registered',
          attendanceStatus: 'not_checked_in',
          qrToken: crypto.randomUUID(),
          createdBy: context.user.id,
        })
        .returning();

      // 3h. Generate unique Order Number
      const orderNano = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderNumber = `ORD-${String(candidateNumber).padStart(4, '0')}-${orderNano}`;

      // 3i. Create Registration Order
      const [createdOrder] = await tx
        .insert(registrationOrders)
        .values({
          eventId: context.event.id,
          orderNumber,
          ticketId: ticket.id,
          promoCodeId: promoCodeEntity ? promoCodeEntity.id : null,
          attendeeId: createdAttendee.id,
          status: orderStatus,
          currency: pricing.currency,
          unitPrice: pricing.unitPrice.toFixed(2),
          quantity: pricing.quantity,
          grossAmount: pricing.grossAmount.toFixed(2),
          discountAmount: pricing.totalDiscountAmount.toFixed(2),
          taxAmount: pricing.taxAmount.toFixed(2),
          finalAmount: pricing.netPayableAmount.toFixed(2),
          customerName: name,
          customerEmail: email.toLowerCase(),
          customerPhone: phoneNumber || null,
          paymentProvider,
          notes: notes || null,
        })
        .returning();

      // 3j. Record promo code redemption log if applied
      if (pricing.appliedPromo && promoCodeEntity) {
        await tx.insert(promoCodeRedemptions).values({
          promoCodeId: promoCodeEntity.id,
          eventId: context.event.id,
          orderId: createdOrder.id,
          attendeeEmail: email.toLowerCase(),
          discountApplied: pricing.promoDiscountAmount.toFixed(2),
        });
      }

      // 3k. Store dynamic registration answers
      for (const field of formFields) {
        const answerVal = answers[field.fieldKey];
        if (answerVal !== undefined && answerVal !== null) {
          await tx.insert(registrationAnswers).values({
            orderId: createdOrder.id,
            attendeeId: createdAttendee.id,
            fieldId: field.id,
            fieldKey: field.fieldKey,
            answerValue: answerVal,
          });
        }
      }

      return {
        order: createdOrder,
        attendee: createdAttendee,
        pricing,
        ticket,
      };
    });

    // 4. Record Audit Log
    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration.submit',
      entityType: 'order',
      entityId: result.order.id,
      details: {
        orderNumber: result.order.orderNumber,
        ticketName: result.ticket.name,
        quantity: result.order.quantity,
        finalAmount: result.order.finalAmount,
        status: result.order.status,
        attendeeRegNo: result.attendee.registrationNumber,
      },
    });

    return NextResponse.json(
      {
        status: 'ok',
        order: result.order,
        attendee: {
          id: result.attendee.id,
          registrationNumber: result.attendee.registrationNumber,
          name: result.attendee.name,
          category: result.attendee.category,
          email: result.attendee.email,
          paymentStatus: result.attendee.paymentStatus,
        },
        pricing: result.pricing,
        message: result.order.status === 'confirmed'
          ? 'Registration confirmed successfully!'
          : 'Registration recorded. Payment pending (Stage 3 checkout).',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (
      err?.message === 'TICKET_NOT_FOUND' ||
      err?.message === 'TICKET_SALES_CLOSED' ||
      err?.message === 'TICKET_SALES_NOT_STARTED' ||
      err?.message === 'TICKET_SALES_EXPIRED' ||
      typeof err?.message === 'string' && err.message.includes('ticket')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(error);
  }
}
