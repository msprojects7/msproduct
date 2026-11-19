import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventZones, zoneAccessLogs } from '@/db/schema/index';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const zoneSchema = z.object({
  name: z.string().trim().min(1, 'Zone name is required').max(100),
  description: z.string().trim().optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  capacity: z.number().int().min(0).default(0),
  openTime: z.string().datetime().optional().nullable(),
  closeTime: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  allowedTicketTypes: z.array(z.string()).default([]),
  allowedRoles: z.array(z.string()).default([]),
});

/**
 * GET /api/events/[eventId]/zones
 * Returns all configured venue zones with live occupancy counts and recent gate events.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const zones = await db
      .select()
      .from(eventZones)
      .where(eq(eventZones.eventId, context.event.id))
      .orderBy(desc(eventZones.createdAt));

    // Calculate current occupancy for each zone:
    // Net head count = COUNT(granted check_in) - COUNT(granted check_out)
    const logs = await db
      .select({
        zoneId: zoneAccessLogs.zoneId,
        attendeeId: zoneAccessLogs.attendeeId,
        action: zoneAccessLogs.action,
        status: zoneAccessLogs.status,
      })
      .from(zoneAccessLogs)
      .where(
        and(
          eq(zoneAccessLogs.eventId, context.event.id),
          eq(zoneAccessLogs.status, 'granted')
        )
      );

    // Compute live occupancy per zone
    const occupancyByZone: Record<string, Set<string>> = {};
    for (const z of zones) {
      occupancyByZone[z.id] = new Set<string>();
    }

    for (const log of logs) {
      if (!occupancyByZone[log.zoneId]) {
        occupancyByZone[log.zoneId] = new Set<string>();
      }
      if (log.action === 'check_in') {
        occupancyByZone[log.zoneId].add(log.attendeeId);
      } else if (log.action === 'check_out') {
        occupancyByZone[log.zoneId].delete(log.attendeeId);
      }
    }

    const enrichedZones = zones.map((z) => {
      const currentOccupancy = occupancyByZone[z.id]?.size || 0;
      const isOverCapacity = z.capacity > 0 && currentOccupancy >= z.capacity;
      const occupancyPercentage = z.capacity > 0 ? Math.min(100, Math.round((currentOccupancy / z.capacity) * 100)) : 0;

      return {
        ...z,
        currentOccupancy,
        isOverCapacity,
        occupancyPercentage,
      };
    });

    // Fetch recent 20 zone access logs
    const recentLogs = await db
      .select()
      .from(zoneAccessLogs)
      .where(eq(zoneAccessLogs.eventId, context.event.id))
      .orderBy(desc(zoneAccessLogs.scannedAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      eventId: context.event.id,
      zones: enrichedZones,
      recentLogs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/zones
 * Creates a new zone with access control and capacity rules.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_checkin');

    const body = await request.json();
    const validated = zoneSchema.parse(body);

    const [created] = await db
      .insert(eventZones)
      .values({
        eventId: context.event.id,
        name: validated.name,
        description: validated.description || null,
        location: validated.location || null,
        capacity: validated.capacity,
        openTime: validated.openTime ? new Date(validated.openTime) : null,
        closeTime: validated.closeTime ? new Date(validated.closeTime) : null,
        isActive: validated.isActive,
        allowedTicketTypes: validated.allowedTicketTypes,
        allowedRoles: validated.allowedRoles,
      })
      .returning();

    return NextResponse.json({
      success: true,
      zone: created,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/events/[eventId]/zones
 * Updates an existing zone.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_checkin');

    const body = await request.json();
    const { zoneId, ...rest } = body;

    if (!zoneId) {
      return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    const validated = zoneSchema.partial().parse(rest);

    const [updated] = await db
      .update(eventZones)
      .set({
        ...(validated.name ? { name: validated.name } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.location !== undefined ? { location: validated.location } : {}),
        ...(validated.capacity !== undefined ? { capacity: validated.capacity } : {}),
        ...(validated.openTime !== undefined ? { openTime: validated.openTime ? new Date(validated.openTime) : null } : {}),
        ...(validated.closeTime !== undefined ? { closeTime: validated.closeTime ? new Date(validated.closeTime) : null } : {}),
        ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {}),
        ...(validated.allowedTicketTypes ? { allowedTicketTypes: validated.allowedTicketTypes } : {}),
        ...(validated.allowedRoles ? { allowedRoles: validated.allowedRoles } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(eventZones.id, zoneId), eq(eventZones.eventId, context.event.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      zone: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/events/[eventId]/zones
 * Deletes a zone and cascading access logs.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_checkin');

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId query param is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(eventZones)
      .where(and(eq(eventZones.id, zoneId), eq(eventZones.eventId, context.event.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Zone deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
