import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { attendees, registrationCounters } from '@/db/schema/index';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAttendeeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  registrationNumber: z.string().trim().max(100).optional().nullable(),
  category: z.string().trim().max(100).default('Delegate'),
  phoneNumber: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email('Invalid email address').max(255).optional().nullable().or(z.literal('')),
  gender: z.string().trim().max(50).optional().nullable(),
  medicalCouncilNumber: z.string().trim().max(100).optional().nullable(),
  foodPreference: z.string().trim().max(50).default('Not Specified'),
  paymentStatus: z.string().trim().max(50).default('Paid'),
  address: z.string().trim().max(500).optional().nullable(),
  registrationType: z.enum(['pre_registered', 'spot']).default('pre_registered'),
});

/**
 * GET /api/events/[eventId]/attendees
 * Lists attendees for the event with search, filtering, pagination, and PII redaction.
 * Requires 'event:view' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
    const search = (searchParams.get('search')?.trim() || '').slice(0, 100);
    const category = (searchParams.get('category')?.trim() || '').slice(0, 100);
    const attendanceStatus = (searchParams.get('attendanceStatus')?.trim() || '').slice(0, 50);
    const paymentStatus = (searchParams.get('paymentStatus')?.trim() || '').slice(0, 50);
    const registrationType = (searchParams.get('registrationType')?.trim() || '').slice(0, 50);

    // Build scoped query conditions
    const conditions = [eq(attendees.eventId, context.event.id)];

    if (category && category !== 'all') {
      conditions.push(eq(attendees.category, category));
    }
    if (attendanceStatus && attendanceStatus !== 'all') {
      conditions.push(eq(attendees.attendanceStatus, attendanceStatus));
    }
    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push(eq(attendees.paymentStatus, paymentStatus));
    }
    if (registrationType && registrationType !== 'all') {
      conditions.push(eq(attendees.registrationType, registrationType));
    }
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(attendees.name, searchPattern),
          ilike(attendees.registrationNumber, searchPattern),
          ilike(attendees.phoneNumber, searchPattern),
          ilike(attendees.email, searchPattern),
          ilike(attendees.medicalCouncilNumber, searchPattern)
        )!
      );
    }

    // Total count query
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendees)
      .where(and(...conditions));

    // Paginated records query
    const offset = (page - 1) * pageSize;
    const rawAttendees = await db
      .select()
      .from(attendees)
      .where(and(...conditions))
      .orderBy(desc(attendees.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Enforce PII redaction for low-privilege roles (e.g. scanner_operator)
    const canViewPii = context.hasPermission('event:view_attendee_pii');
    const sanitizedAttendees = rawAttendees.map((a) => {
      if (canViewPii) return a;
      return {
        ...a,
        phoneNumber: null,
        email: null,
        medicalCouncilNumber: null,
      };
    });

    return NextResponse.json({
      status: 'ok',
      eventId: context.event.id,
      attendees: sanitizedAttendees,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/attendees
 * Registers a new attendee manually under the event.
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

    const parsed = createAttendeeSchema.safeParse(body);
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
      registrationNumber,
      category,
      phoneNumber,
      email,
      gender,
      medicalCouncilNumber,
      foodPreference,
      paymentStatus,
      registrationType,
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

    // Transactionally generate registration number (if needed), insert attendee and write audit log
    try {
      const [createdAttendee] = await db.transaction(async (tx) => {
        let finalRegNumber = (registrationNumber || '').trim();

        if (!finalRegNumber) {
          // Resolve or increment counter atomically with lock
          const [counter] = await tx
            .select()
            .from(registrationCounters)
            .where(and(
              eq(registrationCounters.eventId, context.event.id),
              eq(registrationCounters.counterKey, 'delegate_counter')
            ))
            .for('update');

          if (counter) {
            finalRegNumber = `${counter.prefix}${counter.nextValue}`;
            await tx
              .update(registrationCounters)
              .set({ nextValue: counter.nextValue + 1 })
              .where(eq(registrationCounters.id, counter.id));
          } else {
            const [{ count }] = await tx
              .select({ count: sql<number>`count(*)::int` })
              .from(attendees)
              .where(eq(attendees.eventId, context.event.id));
            finalRegNumber = `REG-${1001 + count}`;
          }
        } else {
          // Check for duplicate registration number if manually passed
          const [existing] = await tx
            .select({ id: attendees.id })
            .from(attendees)
            .where(and(
              eq(attendees.eventId, context.event.id),
              eq(attendees.registrationNumber, finalRegNumber)
            ))
            .limit(1);

          if (existing) {
            throw new Error(`REGISTRATION_NUMBER_EXISTS:${finalRegNumber}`);
          }
        }

        const [created] = await tx
          .insert(attendees)
          .values({
            eventId: context.event.id,
            registrationNumber: finalRegNumber,
            name,
            category: category || 'Delegate',
            phoneNumber: phoneNumber || null,
            email: email || null,
            gender: gender || null,
            medicalCouncilNumber: medicalCouncilNumber || null,
            foodPreference,
            paymentStatus,
            registrationType,
            attendanceStatus: 'not_checked_in',
            createdBy: context.user.id,
          })
          .returning();

        await recordAuditEvent(
          {
            organizationId: context.organization.id,
            eventId: context.event.id,
            userId: context.user.id,
            action: 'attendee:created',
            entityType: 'attendees',
            entityId: created.id,
            details: {
              registrationNumber: created.registrationNumber,
              name: created.name,
              category: created.category,
              registrationType: created.registrationType,
            },
          },
          tx
        );

        return [created];
      });

      return NextResponse.json(
        {
          status: 'ok',
          message: 'Attendee registered successfully',
          attendee: createdAttendee,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      if (dbError?.code === '23505' || dbError?.cause?.code === '23505' || dbError?.message?.startsWith('REGISTRATION_NUMBER_EXISTS:')) {
        const conflictNumber = dbError?.message?.startsWith('REGISTRATION_NUMBER_EXISTS:')
          ? dbError.message.split(':')[1]
          : (registrationNumber || 'specified');
        return NextResponse.json(
          {
            error: `Registration number '${conflictNumber}' already exists in this event`,
            code: 'REGISTRATION_NUMBER_EXISTS',
          },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
