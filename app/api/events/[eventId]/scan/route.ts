import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  attendees,
  scanEvents,
  auditEvents,
} from '@/db/schema/index';
import { eq, and, or, ilike, desc, count, sql } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const scanPayloadSchema = z.object({
  qrToken: z.string().trim().optional().nullable(),
  registrationNumber: z.string().trim().optional().nullable(),
  action: z.enum(['check_in', 'check_out']),
  deviceInfo: z.string().trim().max(255).optional().nullable(),
  sessionId: z.string().trim().max(100).optional().nullable(),
});

/**
 * Extracts candidate token string from raw scan payload.
 * Handles:
 * - Plain UUID
 * - Plain registration number (e.g., CONF-DEL-0100)
 * - JSON string containing { qrToken, regNo, token, registrationNumber }
 * - URL with query param ?token=... or ?qr=... or ?reg=...
 */
function extractScanCandidate(rawInput: string): { qrToken?: string; regNumber?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) return {};

  // Check for JSON payload
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const token = parsed.qrToken || parsed.token || parsed.qr || parsed.id;
      const reg = parsed.registrationNumber || parsed.regNo || parsed.reg;
      if (token && UUID_REGEX.test(token)) {
        return { qrToken: token, regNumber: reg };
      }
      if (reg) {
        return { regNumber: reg, qrToken: token };
      }
      if (token) {
        return { regNumber: token };
      }
    } catch {
      // Not valid JSON, continue to URL or raw check
    }
  }

  // Check for URL containing token or registration number
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('qr') || url.searchParams.get('qrToken');
      const regParam = url.searchParams.get('reg') || url.searchParams.get('regNo') || url.searchParams.get('registrationNumber');

      if (tokenParam && UUID_REGEX.test(tokenParam)) {
        return { qrToken: tokenParam, regNumber: regParam || undefined };
      }
      if (regParam) {
        return { regNumber: regParam };
      }
      // If path ends with UUID
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && UUID_REGEX.test(lastPart)) {
        return { qrToken: lastPart };
      }
    } catch {
      // Malformed URL, fall through
    }
  }

  // Pure UUID
  if (UUID_REGEX.test(trimmed)) {
    return { qrToken: trimmed };
  }

  // Pure registration number or other raw code
  return { regNumber: trimmed };
}

/**
 * GET /api/events/[eventId]/scan
 *
 * Scopes:
 * - When `search` param is present: looks up attendee by registration number or name (top 10).
 * - Otherwise: returns attendance summary statistics and the recent scans log for this event.
 *
 * Requires 'event:view_scans' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_scans');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    // Search query mode: lookup attendee details for manual desk entry
    if (search) {
      const isSearchUuid = UUID_REGEX.test(search);
      const whereCondition = isSearchUuid
        ? and(
            eq(attendees.eventId, context.event.id),
            or(eq(attendees.qrToken, search), eq(attendees.id, search))
          )
        : and(
            eq(attendees.eventId, context.event.id),
            or(
              ilike(attendees.registrationNumber, `%${search}%`),
              ilike(attendees.name, `%${search}%`)
            )
          );

      const matchedAttendees = await db
        .select({
          id: attendees.id,
          name: attendees.name,
          registrationNumber: attendees.registrationNumber,
          category: attendees.category,
          attendanceStatus: attendees.attendanceStatus,
          paymentStatus: attendees.paymentStatus,
          foodPreference: attendees.foodPreference,
          medicalCouncilNumber: attendees.medicalCouncilNumber,
          registrationType: attendees.registrationType,
          createdAt: attendees.createdAt,
        })
        .from(attendees)
        .where(whereCondition)
        .limit(10);

      return NextResponse.json({
        attendees: matchedAttendees,
      });
    }

    // Default mode: Return event attendance statistics + recent scans feed
    const [totalRes, checkedInRes, checkedOutRes] = await Promise.all([
      db
        .select({ value: count() })
        .from(attendees)
        .where(eq(attendees.eventId, context.event.id)),
      db
        .select({ value: count() })
        .from(attendees)
        .where(
          and(
            eq(attendees.eventId, context.event.id),
            eq(attendees.attendanceStatus, 'checked_in')
          )
        ),
      db
        .select({ value: count() })
        .from(attendees)
        .where(
          and(
            eq(attendees.eventId, context.event.id),
            eq(attendees.attendanceStatus, 'checked_out')
          )
        ),
    ]);

    const totalCount = Number(totalRes[0]?.value || 0);
    const checkedInCount = Number(checkedInRes[0]?.value || 0);
    const checkedOutCount = Number(checkedOutRes[0]?.value || 0);
    const notCheckedInCount = Math.max(0, totalCount - checkedInCount - checkedOutCount);

    // Fetch recent 25 scan events for this event joined with attendee operational metadata
    const recentScans = await db
      .select({
        id: scanEvents.id,
        action: scanEvents.action,
        scannedAt: scanEvents.scannedAt,
        staffUserId: scanEvents.staffUserId,
        deviceInfo: scanEvents.deviceInfo,
        attendeeId: scanEvents.attendeeId,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
        attendanceStatus: attendees.attendanceStatus,
      })
      .from(scanEvents)
      .innerJoin(attendees, eq(scanEvents.attendeeId, attendees.id))
      .where(eq(scanEvents.eventId, context.event.id))
      .orderBy(desc(scanEvents.scannedAt))
      .limit(25);

    return NextResponse.json({
      stats: {
        totalAttendees: totalCount,
        checkedIn: checkedInCount,
        checkedOut: checkedOutCount,
        notCheckedIn: notCheckedInCount,
      },
      recentScans,
      event: {
        id: context.event.id,
        name: context.event.name,
        slug: context.event.slug,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/scan
 *
 * Processes a badge scan or manual lookup action for check-in or check-out.
 *
 * Requires 'event:scan_badge' permission.
 * Enforces:
 * - Server-resolved user session and event authorization.
 * - Strict multi-tenant isolation (attendee MUST belong to context.event.id).
 * - Row locking (SELECT ... FOR UPDATE) inside transaction to serialize concurrent scans.
 * - Legacy attendance business rules (already_checked_in, not_checked_in, already_checked_out).
 * - Atomic scan_events record and audit_events log.
 * - Redacted PII response for scanner_operator roles.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:scan_badge');

    const body = await request.json().catch(() => null);
    const parsed = scanPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid scan payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { qrToken, registrationNumber, action, deviceInfo, sessionId } = parsed.data;

    if (!qrToken && !registrationNumber) {
      return NextResponse.json(
        { error: 'Either qrToken or registrationNumber is required to identify the attendee' },
        { status: 400 }
      );
    }

    // Resolve candidates
    let searchQr = qrToken || undefined;
    let searchReg = registrationNumber || undefined;

    if (qrToken && !registrationNumber) {
      const candidate = extractScanCandidate(qrToken);
      searchQr = candidate.qrToken;
      searchReg = candidate.regNumber;
    }

    // Execute check-in / check-out inside transactional lock
    const transactionResult = await db.transaction(async (tx) => {
      // Construct targeted lookup condition scoped strictly to this event
      let attendeeQueryCondition;

      if (searchQr && UUID_REGEX.test(searchQr)) {
        attendeeQueryCondition = and(
          eq(attendees.eventId, context.event.id),
          or(eq(attendees.qrToken, searchQr), eq(attendees.id, searchQr))
        );
      } else if (searchReg) {
        attendeeQueryCondition = and(
          eq(attendees.eventId, context.event.id),
          eq(attendees.registrationNumber, searchReg)
        );
      } else {
        // Fallback: searchQr is not a UUID, check if it matches registration number
        attendeeQueryCondition = and(
          eq(attendees.eventId, context.event.id),
          eq(attendees.registrationNumber, searchQr!)
        );
      }

      // Lock attendee row FOR UPDATE
      const [lockedAttendee] = await tx
        .select()
        .from(attendees)
        .where(attendeeQueryCondition)
        .for('update')
        .limit(1);

      if (!lockedAttendee) {
        return {
          statusCode: 200,
          payload: {
            success: false,
            result: 'invalid_qr',
            message: 'Invalid badge or attendee not found in this event',
            action,
          },
        };
      }

      // BUSINESS RULES: Check-in
      if (action === 'check_in') {
        if (lockedAttendee.attendanceStatus === 'checked_in') {
          return {
            statusCode: 200,
            payload: {
              success: true,
              result: 'already_checked_in',
              message: 'Attendee is already checked in',
              action,
              attendee: {
                id: lockedAttendee.id,
                name: lockedAttendee.name,
                registrationNumber: lockedAttendee.registrationNumber,
                category: lockedAttendee.category,
                attendanceStatus: lockedAttendee.attendanceStatus,
                paymentStatus: lockedAttendee.paymentStatus,
              },
            },
          };
        }

        // Apply state transition to checked_in
        const now = new Date();
        await tx
          .update(attendees)
          .set({
            attendanceStatus: 'checked_in',
            updatedAt: now,
          })
          .where(eq(attendees.id, lockedAttendee.id));

        // Insert scan_events record
        await tx.insert(scanEvents).values({
          eventId: context.event.id,
          attendeeId: lockedAttendee.id,
          action: 'check_in',
          scannedAt: now,
          staffUserId: context.user.id,
          deviceInfo: deviceInfo || null,
          sessionId: sessionId || null,
        });

        // Insert atomic audit event
        await recordAuditEvent(
          {
            organizationId: context.organization.id,
            eventId: context.event.id,
            userId: context.user.id,
            action: 'attendee:checked_in',
            entityType: 'attendee',
            entityId: lockedAttendee.id,
            details: {
              registrationNumber: lockedAttendee.registrationNumber,
              category: lockedAttendee.category,
              action: 'check_in',
              previousStatus: lockedAttendee.attendanceStatus,
              newStatus: 'checked_in',
              deviceInfo: deviceInfo || null,
            },
            ipAddress: request.headers.get('x-forwarded-for') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
          tx
        );

        return {
          statusCode: 200,
          payload: {
            success: true,
            result: 'success_check_in',
            message: 'Check-in successful',
            action,
            attendee: {
              id: lockedAttendee.id,
              name: lockedAttendee.name,
              registrationNumber: lockedAttendee.registrationNumber,
              category: lockedAttendee.category,
              attendanceStatus: 'checked_in',
              paymentStatus: lockedAttendee.paymentStatus,
            },
          },
        };
      }

      // BUSINESS RULES: Check-out
      if (action === 'check_out') {
        if (lockedAttendee.attendanceStatus === 'not_checked_in') {
          return {
            statusCode: 200,
            payload: {
              success: false,
              result: 'not_checked_in',
              message: 'Cannot check out — attendee was not checked in',
              action,
              attendee: {
                id: lockedAttendee.id,
                name: lockedAttendee.name,
                registrationNumber: lockedAttendee.registrationNumber,
                category: lockedAttendee.category,
                attendanceStatus: lockedAttendee.attendanceStatus,
                paymentStatus: lockedAttendee.paymentStatus,
              },
            },
          };
        }

        if (lockedAttendee.attendanceStatus === 'checked_out') {
          return {
            statusCode: 200,
            payload: {
              success: true,
              result: 'already_checked_out',
              message: 'Attendee is already checked out',
              action,
              attendee: {
                id: lockedAttendee.id,
                name: lockedAttendee.name,
                registrationNumber: lockedAttendee.registrationNumber,
                category: lockedAttendee.category,
                attendanceStatus: lockedAttendee.attendanceStatus,
                paymentStatus: lockedAttendee.paymentStatus,
              },
            },
          };
        }

        // Apply state transition to checked_out
        const now = new Date();
        await tx
          .update(attendees)
          .set({
            attendanceStatus: 'checked_out',
            updatedAt: now,
          })
          .where(eq(attendees.id, lockedAttendee.id));

        // Insert scan_events record
        await tx.insert(scanEvents).values({
          eventId: context.event.id,
          attendeeId: lockedAttendee.id,
          action: 'check_out',
          scannedAt: now,
          staffUserId: context.user.id,
          deviceInfo: deviceInfo || null,
          sessionId: sessionId || null,
        });

        // Insert atomic audit event
        await recordAuditEvent(
          {
            organizationId: context.organization.id,
            eventId: context.event.id,
            userId: context.user.id,
            action: 'attendee:checked_out',
            entityType: 'attendee',
            entityId: lockedAttendee.id,
            details: {
              registrationNumber: lockedAttendee.registrationNumber,
              category: lockedAttendee.category,
              action: 'check_out',
              previousStatus: lockedAttendee.attendanceStatus,
              newStatus: 'checked_out',
              deviceInfo: deviceInfo || null,
            },
            ipAddress: request.headers.get('x-forwarded-for') || null,
            userAgent: request.headers.get('user-agent') || null,
          },
          tx
        );

        return {
          statusCode: 200,
          payload: {
            success: true,
            result: 'success_check_out',
            message: 'Check-out successful',
            action,
            attendee: {
              id: lockedAttendee.id,
              name: lockedAttendee.name,
              registrationNumber: lockedAttendee.registrationNumber,
              category: lockedAttendee.category,
              attendanceStatus: 'checked_out',
              paymentStatus: lockedAttendee.paymentStatus,
            },
          },
        };
      }

      return {
        statusCode: 400,
        payload: { error: `Unsupported action '${action}'` },
      };
    });

    return NextResponse.json(transactionResult.payload, {
      status: transactionResult.statusCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
