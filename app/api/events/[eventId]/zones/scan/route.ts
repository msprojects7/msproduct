import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { attendees, eventZones, zoneAccessLogs } from '@/db/schema/index';
import { eq, and, or, ilike } from 'drizzle-orm';
import { extractScanIdentifier } from '@/lib/attendance/checkin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const zoneScanSchema = z.object({
  zoneId: z.string().uuid('Valid zoneId is required'),
  identifier: z.string().trim().min(1, 'Scan identifier is required'),
  action: z.enum(['check_in', 'check_out']).default('check_in'),
  deviceInfo: z.string().trim().max(255).optional().nullable(),
});

/**
 * POST /api/events/[eventId]/zones/scan
 * Validates badge/QR scan against zone permissions, capacity limits, and operating hours.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view_scans');

    const body = await request.json();
    const validated = zoneScanSchema.parse(body);

    // 1. Resolve Zone
    const [zone] = await db
      .select()
      .from(eventZones)
      .where(and(eq(eventZones.id, validated.zoneId), eq(eventZones.eventId, context.event.id)))
      .limit(1);

    if (!zone) {
      return NextResponse.json({
        access: 'denied',
        status: 'denied',
        reason: 'ZONE_NOT_FOUND',
        message: 'Specified zone does not exist for this event',
      }, { status: 404 });
    }

    if (!zone.isActive) {
      return NextResponse.json({
        access: 'denied',
        status: 'denied',
        reason: 'ZONE_INACTIVE',
        message: `Zone '${zone.name}' is currently closed or inactive.`,
      }, { status: 403 });
    }

    // 2. Check Operating Hours if configured
    const now = new Date();
    if (zone.openTime && now < new Date(zone.openTime)) {
      return NextResponse.json({
        access: 'denied',
        status: 'denied',
        reason: 'ZONE_NOT_YET_OPEN',
        message: `Zone '${zone.name}' opens at ${new Date(zone.openTime).toLocaleTimeString()}.`,
      }, { status: 403 });
    }
    if (zone.closeTime && now > new Date(zone.closeTime)) {
      return NextResponse.json({
        access: 'denied',
        status: 'denied',
        reason: 'ZONE_CLOSED',
        message: `Zone '${zone.name}' closed at ${new Date(zone.closeTime).toLocaleTimeString()}.`,
      }, { status: 403 });
    }

    // 3. Resolve Attendee
    const rawInput = validated.identifier;
    const { qrToken, regNumber } = extractScanIdentifier(rawInput);

    let attendeeQuery;
    if (qrToken && UUID_REGEX.test(qrToken)) {
      attendeeQuery = and(
        eq(attendees.eventId, context.event.id),
        or(eq(attendees.qrToken, qrToken), eq(attendees.id, qrToken))
      );
    } else if (regNumber) {
      attendeeQuery = and(
        eq(attendees.eventId, context.event.id),
        or(
          eq(attendees.registrationNumber, regNumber),
          ilike(attendees.name, `%${regNumber}%`)
        )
      );
    } else {
      attendeeQuery = and(
        eq(attendees.eventId, context.event.id),
        or(
          eq(attendees.registrationNumber, rawInput),
          eq(attendees.qrToken, rawInput)
        )
      );
    }

    const [attendee] = await db
      .select()
      .from(attendees)
      .where(attendeeQuery)
      .limit(1);

    if (!attendee) {
      return NextResponse.json({
        access: 'denied',
        status: 'denied',
        reason: 'ATTENDEE_NOT_FOUND',
        message: 'No attendee found matching scanned QR code or badge identifier.',
      }, { status: 404 });
    }

    // 4. Calculate current occupancy
    const zoneLogs = await db
      .select({
        attendeeId: zoneAccessLogs.attendeeId,
        action: zoneAccessLogs.action,
        status: zoneAccessLogs.status,
      })
      .from(zoneAccessLogs)
      .where(
        and(
          eq(zoneAccessLogs.zoneId, zone.id),
          eq(zoneAccessLogs.status, 'granted')
        )
      );

    const occupants = new Set<string>();
    for (const l of zoneLogs) {
      if (l.action === 'check_in') occupants.add(l.attendeeId);
      if (l.action === 'check_out') occupants.delete(l.attendeeId);
    }
    const currentOccupancy = occupants.size;

    // 5. Evaluate Access Permissions
    const allowedTickets = Array.isArray(zone.allowedTicketTypes) ? (zone.allowedTicketTypes as string[]) : [];
    const allowedRoles = Array.isArray(zone.allowedRoles) ? (zone.allowedRoles as string[]) : [];

    let isAuthorized = true;
    let denialReason: string | null = null;
    let message = '';

    if (allowedTickets.length > 0) {
      const attendeeCategory = (attendee.category || '').toLowerCase();
      const match = allowedTickets.some((t) => t.toLowerCase() === attendeeCategory);
      if (!match) {
        isAuthorized = false;
        denialReason = 'TICKET_CLASS_RESTRICTED';
        message = `Access restricted: Ticket tier '${attendee.category}' is not authorized for '${zone.name}'.`;
      }
    }

    // 6. Capacity Check (only on check_in)
    if (isAuthorized && validated.action === 'check_in' && zone.capacity > 0) {
      if (currentOccupancy >= zone.capacity && !occupants.has(attendee.id)) {
        isAuthorized = false;
        denialReason = 'CAPACITY_REACHED';
        message = `Zone '${zone.name}' has reached maximum capacity (${currentOccupancy}/${zone.capacity}).`;
      }
    }

    const scanStatus = isAuthorized ? 'granted' : 'denied';

    // 7. Log immutable access event
    const [log] = await db
      .insert(zoneAccessLogs)
      .values({
        eventId: context.event.id,
        zoneId: zone.id,
        attendeeId: attendee.id,
        action: validated.action,
        status: scanStatus,
        denialReason,
        staffUserId: context.user.id,
        deviceInfo: validated.deviceInfo || 'Gate Scanner Console',
      })
      .returning();

    const newOccupancy = isAuthorized
      ? validated.action === 'check_in'
        ? occupants.add(attendee.id).size
        : (occupants.delete(attendee.id), occupants.size)
      : currentOccupancy;

    if (isAuthorized) {
      message = validated.action === 'check_in'
        ? `Welcome ${attendee.name}! Access granted to ${zone.name}.`
        : `Check-out recorded for ${attendee.name}.`;
    }

    return NextResponse.json({
      access: scanStatus,
      status: scanStatus,
      action: validated.action,
      message,
      denialReason,
      zone: {
        id: zone.id,
        name: zone.name,
        location: zone.location,
        capacity: zone.capacity,
        currentOccupancy: newOccupancy,
      },
      attendee: {
        id: attendee.id,
        name: attendee.name,
        registrationNumber: attendee.registrationNumber,
        category: attendee.category,
        email: attendee.email,
        company: null,
      },
      logId: log.id,
      timestamp: log.scannedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
