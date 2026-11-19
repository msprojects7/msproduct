import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { events } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/events
 * Lists all events belonging to the specified organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    const orgEvents = await db
      .select()
      .from(events)
      .where(eq(events.organizationId, context.organization.id));

    return NextResponse.json({
      status: 'ok',
      organizationId: context.organization.id,
      events: orgEvents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/organizations/[orgId]/events
 * Creates a new event under the specified organization.
 * Requires 'org:create_event' permission (owner or admin).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:create_event');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { name, slug, venue, startDate, endDate, status = 'draft' } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Event name must be between 2 and 100 characters', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Event slug is required', code: 'INVALID_SLUG' },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(normalizedSlug) || normalizedSlug.length < 2 || normalizedSlug.length > 60) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens (2-60 chars)', code: 'INVALID_SLUG' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'published', 'ongoing', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Check slug uniqueness within organization
    const [existingEvent] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.organizationId, context.organization.id),
          eq(events.slug, normalizedSlug)
        )
      )
      .limit(1);

    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event with this slug already exists in this organization', code: 'SLUG_CONFLICT' },
        { status: 409 }
      );
    }

    // Insert event atomically with audit log
    const [createdEvent] = await db.transaction(async (tx) => {
      const [newEvent] = await tx
        .insert(events)
        .values({
          organizationId: context.organization.id,
          name: name.trim(),
          slug: normalizedSlug,
          venue: typeof venue === 'string' && venue.trim() ? venue.trim() : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status,
        })
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: newEvent.id,
          userId: context.user.id,
          action: 'event:created',
          entityType: 'events',
          entityId: newEvent.id,
          details: { name: newEvent.name, slug: newEvent.slug, status },
        },
        tx
      );

      return [newEvent];
    });

    return NextResponse.json(
      {
        status: 'ok',
        event: createdEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
