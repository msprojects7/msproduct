import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations, organizationMembers, events, eventStaffAssignments } from '@/db/schema/index';
import { eq, and, or, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Lists all events accessible to the authenticated user across their organizations and staff assignments.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUserSession();

    // 1. Find organizations where user is owner or admin (has broad event access)
    const adminOrgs = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.isActive, true),
          eq(organizations.isActive, true),
          or(eq(organizationMembers.role, 'owner'), eq(organizationMembers.role, 'admin'))
        )
      );

    const adminOrgIds = adminOrgs.map((o) => o.organizationId);

    // 2. Fetch events from those admin organizations
    let orgEvents: Array<typeof events.$inferSelect> = [];
    if (adminOrgIds.length > 0) {
      orgEvents = await db
        .select()
        .from(events)
        .where(inArray(events.organizationId, adminOrgIds));
    }

    // 3. Fetch events where user has an active staff assignment
    const assignedEvents = await db
      .select({
        id: events.id,
        organizationId: events.organizationId,
        name: events.name,
        slug: events.slug,
        venue: events.venue,
        startDate: events.startDate,
        endDate: events.endDate,
        status: events.status,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(eventStaffAssignments)
      .innerJoin(events, eq(eventStaffAssignments.eventId, events.id))
      .innerJoin(organizations, eq(events.organizationId, organizations.id))
      .where(
        and(
          eq(eventStaffAssignments.userId, user.id),
          eq(eventStaffAssignments.isActive, true),
          eq(organizations.isActive, true)
        )
      );

    // 4. Merge and deduplicate by event id
    const eventMap = new Map<string, typeof events.$inferSelect>();
    for (const evt of orgEvents) {
      eventMap.set(evt.id, evt);
    }
    for (const evt of assignedEvents) {
      if (!eventMap.has(evt.id)) {
        eventMap.set(evt.id, evt);
      }
    }

    return NextResponse.json({
      status: 'ok',
      events: Array.from(eventMap.values()),
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
