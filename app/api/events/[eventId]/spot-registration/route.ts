import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  attendees,
  registrationCounters,
  spotRegistrationKeys,
  eventSettings,
} from '@/db/schema/index';
import { eq, and, sql } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const spotRegistrationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  category: z.string().trim().min(1, 'Category is required').max(100).default('Delegate'),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email('Invalid email address').max(255).optional().nullable().or(z.literal('')),
  gender: z.string().trim().max(50).optional().nullable(),
  medicalCouncilNumber: z.string().trim().max(100).optional().nullable(),
  foodPreference: z.string().trim().max(50).default('Not Specified'),
  paymentStatus: z.string().trim().max(50).default('Paid'),
  address: z.string().trim().max(500).optional().nullable(),
  idempotencyKey: z.string().trim().max(255).optional().nullable(),
});

/**
 * Resolves a category to an appropriate counterKey in registration_counters.
 */
function resolveCounterKey(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('faculty')) return 'faculty_counter';
  if (cat.includes('postgraduate') || cat.includes('post graduate') || cat.includes('student') || cat.includes('undergraduate')) {
    return 'student_counter';
  }
  if (cat.includes('exhibitor')) return 'exhibitor_counter';
  if (cat.includes('accompanying')) return 'accompanying_counter';
  if (cat.includes('vip') || cat.includes('guest')) return 'vip_counter';
  return 'delegate_counter';
}

/**
 * GET /api/events/[eventId]/spot-registration
 * Fetches available counters, settings, and configuration for the spot registration desk.
 * Requires 'event:create_attendee' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:create_attendee');

    const [counters, settings] = await Promise.all([
      db
        .select()
        .from(registrationCounters)
        .where(eq(registrationCounters.eventId, context.event.id)),
      db
        .select()
        .from(eventSettings)
        .where(eq(eventSettings.eventId, context.event.id)),
    ]);

    return NextResponse.json({
      status: 'ok',
      eventId: context.event.id,
      eventName: context.event.name,
      eventSlug: context.event.slug,
      counters,
      settings: settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, any>),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/spot-registration
 * Atomically generates a sequential registration number, creates spot attendee,
 * manages idempotency, and logs audit record.
 * Requires 'event:create_attendee' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:create_attendee');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const parsed = spotRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      category,
      phoneNumber,
      email,
      gender,
      medicalCouncilNumber,
      foodPreference,
      paymentStatus,
      idempotencyKey,
    } = parsed.data;

    // Enforce Plan Attendee Capacity & Extra Attendee Quotas
    const { checkAttendeeCapacity } = await import('@/lib/payments/capacity');
    const capacityCheck = await checkAttendeeCapacity(context.organization.id, context.event.id, 1);
    if (!capacityCheck.allowed) {
      return NextResponse.json(
        {
          error: capacityCheck.reason,
          code: 'CAPACITY_LIMIT_EXCEEDED',
          details: {
            currentCount: capacityCheck.currentCount,
            maxAllowed: capacityCheck.maxAllowed,
            planId: capacityCheck.planId,
            planName: capacityCheck.planName,
            isExpired: capacityCheck.isExpired,
            upgradeRequired: capacityCheck.upgradeRequired,
            payExtraAllowed: capacityCheck.payExtraAllowed,
            extraAttendeePriceInPaise: capacityCheck.extraAttendeePriceInPaise,
          },
        },
        { status: 403 }
      );
    }

    // Execute atomic spot registration workflow
    const result = await db.transaction(async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const [existingKey] = await tx
          .select({
            id: spotRegistrationKeys.id,
            attendeeId: spotRegistrationKeys.attendeeId,
          })
          .from(spotRegistrationKeys)
          .where(and(
            eq(spotRegistrationKeys.eventId, context.event.id),
            eq(spotRegistrationKeys.idempotencyKey, idempotencyKey)
          ))
          .limit(1);

        if (existingKey) {
          const [existingAttendee] = await tx
            .select()
            .from(attendees)
            .where(and(
              eq(attendees.id, existingKey.attendeeId),
              eq(attendees.eventId, context.event.id)
            ))
            .limit(1);

          if (existingAttendee) {
            return {
              idempotent: true,
              attendee: existingAttendee,
            };
          }
        }
      }

      // 2. Resolve & Lock Sequential Registration Counter
      const targetCounterKey = resolveCounterKey(category);

      let [counter] = await tx
        .select()
        .from(registrationCounters)
        .where(and(
          eq(registrationCounters.eventId, context.event.id),
          eq(registrationCounters.counterKey, targetCounterKey)
        ))
        .for('update')
        .limit(1);

      // If specific category counter not found, try fallback spot counter
      if (!counter) {
        [counter] = await tx
          .select()
          .from(registrationCounters)
          .where(and(
            eq(registrationCounters.eventId, context.event.id),
            eq(registrationCounters.counterKey, 'spot_counter')
          ))
          .for('update')
          .limit(1);
      }

      // If still not configured, auto-initialize a default spot counter for this event
      if (!counter) {
        const prefix = (context.event.slug || 'SPOT')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8) || 'SPOT';

        const [createdCounter] = await tx
          .insert(registrationCounters)
          .values({
            eventId: context.event.id,
            counterKey: targetCounterKey,
            displayName: `${category} Spot Counter`,
            prefix,
            startValue: 1000,
            nextValue: 1000,
            padding: 4,
            lastUsedValue: null,
          })
          .returning();

        counter = createdCounter;
      }

      // 3. Sequential Registration Number Generation (collision-free loop)
      let candidateNumber = counter.nextValue;
      let regNo = '';

      while (true) {
        regNo = `${counter.prefix}-${String(candidateNumber).padStart(counter.padding || 4, '0')}`;

        const [collision] = await tx
          .select({ id: attendees.id })
          .from(attendees)
          .where(and(
            eq(attendees.eventId, context.event.id),
            eq(attendees.registrationNumber, regNo)
          ))
          .limit(1);

        if (!collision) {
          break;
        }
        candidateNumber += 1;
      }

      // 4. Create Spot Attendee
      const qrToken = crypto.randomUUID();

      const [newAttendee] = await tx
        .insert(attendees)
        .values({
          eventId: context.event.id,
          registrationNumber: regNo,
          name,
          category,
          phoneNumber: phoneNumber || null,
          email: email || null,
          gender: gender || null,
          medicalCouncilNumber: medicalCouncilNumber || null,
          foodPreference,
          paymentStatus,
          registrationType: 'spot',
          attendanceStatus: 'not_checked_in',
          qrToken,
          createdBy: context.user.id,
        })
        .returning();

      // 5. Update Registration Counter
      await tx
        .update(registrationCounters)
        .set({
          nextValue: candidateNumber + 1,
          lastUsedValue: candidateNumber,
          updatedAt: new Date(),
        })
        .where(eq(registrationCounters.id, counter.id));

      // 6. Record Idempotency Key
      if (idempotencyKey) {
        await tx
          .insert(spotRegistrationKeys)
          .values({
            eventId: context.event.id,
            idempotencyKey,
            attendeeId: newAttendee.id,
          });
      }

      // 7. Atomic Audit Logging
      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'attendee:spot_registered',
          entityType: 'attendees',
          entityId: newAttendee.id,
          details: {
            registrationNumber: regNo,
            name: newAttendee.name,
            category: newAttendee.category,
            counterKey: counter.counterKey,
            registrationType: 'spot',
          },
        },
        tx
      );

      return {
        idempotent: false,
        attendee: newAttendee,
      };
    });

    return NextResponse.json(
      {
        status: 'ok',
        idempotent: result.idempotent,
        message: result.idempotent
          ? 'Spot registration already completed (idempotent replay)'
          : 'Spot registration completed successfully',
        attendee: result.attendee,
      },
      { status: result.idempotent ? 200 : 201 }
    );
  } catch (error: any) {
    // Catch unique constraint violation on spot_registration_keys if hit by simultaneous identical retries
    if (error?.code === '23505' || error?.cause?.code === '23505') {
      return NextResponse.json(
        {
          error: 'Duplicate spot registration submission in progress or already processed.',
          code: 'IDEMPOTENCY_CONFLICT',
        },
        { status: 409 }
      );
    }

    return handleApiError(error);
  }
}
