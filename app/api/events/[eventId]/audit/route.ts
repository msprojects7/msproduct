import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { auditEvents } from '@/db/schema/index';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[eventId]/audit
 * Retrieves paginated audit log entries for the specified event.
 * Scoped strictly to the event and organization context.
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
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25));
    const actionFilter = searchParams.get('action')?.trim();
    const search = searchParams.get('search')?.trim();

    const conditions = [
      eq(auditEvents.organizationId, context.organization.id),
      eq(auditEvents.eventId, context.event.id),
    ];

    if (actionFilter && actionFilter !== 'all') {
      conditions.push(eq(auditEvents.action, actionFilter));
    }

    if (search) {
      conditions.push(ilike(auditEvents.action, `%${search}%`));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(auditEvents)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Get paginated items
    const events = await db
      .select()
      .from(auditEvents)
      .where(whereClause)
      .orderBy(desc(auditEvents.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
