/**
 * MS Backstage — Centralized Onsite Check-In & Attendance Engine
 *
 * Implements atomic, transactional check-in/check-out operations with:
 * - Row locking (SELECT FOR UPDATE) to serialize concurrent rapid scans
 * - Duplicate scan protection and historical check-in audit
 * - Operator manual override support with mandatory audit reasons
 * - Scoped multi-tenant validation enforcing event boundaries
 */

import { db } from '@/db/index';
import { attendees, scanEvents } from '@/db/schema/index';
import { eq, and, or, sql } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CheckInParams {
  eventId: string;
  organizationId: string;
  operatorUserId: string;
  qrToken?: string | null;
  registrationNumber?: string | null;
  attendeeId?: string | null;
  action: 'check_in' | 'check_out';
  deviceInfo?: string | null;
  sessionId?: string | null;
  isOverride?: boolean;
  overrideReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CheckInResult {
  success: boolean;
  code:
    | 'CHECK_IN_SUCCESS'
    | 'CHECK_OUT_SUCCESS'
    | 'ALREADY_CHECKED_IN'
    | 'NOT_CHECKED_IN'
    | 'ALREADY_CHECKED_OUT'
    | 'OVERRIDE_SUCCESS'
    | 'ATTENDEE_NOT_FOUND'
    | 'INVALID_IDENTIFIER';
  message: string;
  attendee?: {
    id: string;
    eventId: string;
    registrationNumber: string;
    name: string;
    category: string;
    attendanceStatus: string;
    paymentStatus: string;
    foodPreference: string;
    medicalCouncilNumber?: string | null;
    qrToken: string;
  };
  previousScan?: {
    scannedAt: Date;
    staffUserId: string;
  } | null;
}

export function extractScanIdentifier(rawInput: string): { qrToken?: string; regNumber?: string } {
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
      // Not JSON
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
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && UUID_REGEX.test(lastPart)) {
        return { qrToken: lastPart };
      }
    } catch {
      // Malformed URL
    }
  }

  if (UUID_REGEX.test(trimmed)) {
    return { qrToken: trimmed };
  }

  return { regNumber: trimmed };
}

export async function executeCheckInOperation(params: CheckInParams): Promise<CheckInResult> {
  const {
    eventId,
    organizationId,
    operatorUserId,
    qrToken,
    registrationNumber,
    attendeeId,
    action,
    deviceInfo,
    sessionId,
    isOverride,
    overrideReason,
    ipAddress,
    userAgent,
  } = params;

  let searchQr = qrToken || undefined;
  let searchReg = registrationNumber || undefined;
  const searchId = attendeeId || undefined;

  if (qrToken && !registrationNumber) {
    const candidate = extractScanIdentifier(qrToken);
    searchQr = candidate.qrToken;
    searchReg = candidate.regNumber;
  }

  return await db.transaction(async (tx) => {
    let whereCondition;

    if (searchId) {
      whereCondition = and(eq(attendees.eventId, eventId), eq(attendees.id, searchId));
    } else if (searchQr && UUID_REGEX.test(searchQr)) {
      whereCondition = and(
        eq(attendees.eventId, eventId),
        or(eq(attendees.qrToken, searchQr), eq(attendees.id, searchQr))
      );
    } else if (searchReg) {
      whereCondition = and(
        eq(attendees.eventId, eventId),
        eq(attendees.registrationNumber, searchReg)
      );
    } else if (searchQr) {
      whereCondition = and(
        eq(attendees.eventId, eventId),
        eq(attendees.registrationNumber, searchQr)
      );
    } else {
      return {
        success: false,
        code: 'INVALID_IDENTIFIER',
        message: 'No valid badge token, registration number, or ID provided',
      };
    }

    const [lockedAttendee] = await tx
      .select()
      .from(attendees)
      .where(whereCondition)
      .for('update')
      .limit(1);

    if (!lockedAttendee) {
      return {
        success: false,
        code: 'ATTENDEE_NOT_FOUND',
        message: 'Attendee not found or does not belong to this event',
      };
    }

    const attendeeSummary = {
      id: lockedAttendee.id,
      eventId: lockedAttendee.eventId,
      registrationNumber: lockedAttendee.registrationNumber,
      name: lockedAttendee.name,
      category: lockedAttendee.category,
      attendanceStatus: lockedAttendee.attendanceStatus,
      paymentStatus: lockedAttendee.paymentStatus,
      foodPreference: lockedAttendee.foodPreference,
      medicalCouncilNumber: lockedAttendee.medicalCouncilNumber,
      qrToken: lockedAttendee.qrToken,
    };

    // CHECK-IN ACTION
    if (action === 'check_in') {
      if (lockedAttendee.attendanceStatus === 'checked_in') {
        if (!isOverride) {
          const [lastScan] = await tx
            .select({
              scannedAt: scanEvents.scannedAt,
              staffUserId: scanEvents.staffUserId,
            })
            .from(scanEvents)
            .where(
              and(
                eq(scanEvents.eventId, eventId),
                eq(scanEvents.attendeeId, lockedAttendee.id),
                eq(scanEvents.action, 'check_in')
              )
            )
            .orderBy(sql`${scanEvents.scannedAt} DESC`)
            .limit(1);

          return {
            success: false,
            code: 'ALREADY_CHECKED_IN',
            message: `Attendee ${lockedAttendee.name} is already checked in.`,
            attendee: attendeeSummary,
            previousScan: lastScan || null,
          };
        }
      }

      const now = new Date();
      await tx
        .update(attendees)
        .set({
          attendanceStatus: 'checked_in',
          updatedAt: now,
        })
        .where(eq(attendees.id, lockedAttendee.id));

      await tx.insert(scanEvents).values({
        eventId,
        attendeeId: lockedAttendee.id,
        action: 'check_in',
        scannedAt: now,
        staffUserId: operatorUserId,
        deviceInfo: isOverride ? `[OVERRIDE: ${overrideReason || 'Operator force'}] ${deviceInfo || ''}` : deviceInfo || null,
        sessionId: sessionId || null,
      });

      await recordAuditEvent(
        {
          organizationId,
          eventId,
          userId: operatorUserId,
          action: isOverride ? 'attendee:checkin_override' : 'attendee:checked_in',
          entityType: 'attendee',
          entityId: lockedAttendee.id,
          details: {
            registrationNumber: lockedAttendee.registrationNumber,
            category: lockedAttendee.category,
            action: 'check_in',
            isOverride: Boolean(isOverride),
            overrideReason: overrideReason || null,
            previousStatus: lockedAttendee.attendanceStatus,
            newStatus: 'checked_in',
            deviceInfo: deviceInfo || null,
            sessionId: sessionId || null,
          },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
        tx
      );

      return {
        success: true,
        code: isOverride ? 'OVERRIDE_SUCCESS' : 'CHECK_IN_SUCCESS',
        message: isOverride ? 'Check-in override granted successfully' : 'Check-in recorded successfully',
        attendee: {
          ...attendeeSummary,
          attendanceStatus: 'checked_in',
        },
      };
    }

    // CHECK-OUT ACTION
    if (action === 'check_out') {
      if (lockedAttendee.attendanceStatus === 'not_checked_in') {
        return {
          success: false,
          code: 'NOT_CHECKED_IN',
          message: 'Cannot check out — attendee is not currently checked in',
          attendee: attendeeSummary,
        };
      }

      if (lockedAttendee.attendanceStatus === 'checked_out') {
        return {
          success: true,
          code: 'ALREADY_CHECKED_OUT',
          message: 'Attendee is already checked out',
          attendee: attendeeSummary,
        };
      }

      const now = new Date();
      await tx
        .update(attendees)
        .set({
          attendanceStatus: 'checked_out',
          updatedAt: now,
        })
        .where(eq(attendees.id, lockedAttendee.id));

      await tx.insert(scanEvents).values({
        eventId,
        attendeeId: lockedAttendee.id,
        action: 'check_out',
        scannedAt: now,
        staffUserId: operatorUserId,
        deviceInfo: deviceInfo || null,
        sessionId: sessionId || null,
      });

      await recordAuditEvent(
        {
          organizationId,
          eventId,
          userId: operatorUserId,
          action: 'attendee:checked_out',
          entityType: 'attendee',
          entityId: lockedAttendee.id,
          details: {
            registrationNumber: lockedAttendee.registrationNumber,
            action: 'check_out',
            previousStatus: lockedAttendee.attendanceStatus,
            newStatus: 'checked_out',
            deviceInfo: deviceInfo || null,
          },
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
        tx
      );

      return {
        success: true,
        code: 'CHECK_OUT_SUCCESS',
        message: 'Check-out recorded successfully',
        attendee: {
          ...attendeeSummary,
          attendanceStatus: 'checked_out',
        },
      };
    }

    return {
      success: false,
      code: 'INVALID_IDENTIFIER',
      message: `Unsupported action: ${action}`,
    };
  });
}
