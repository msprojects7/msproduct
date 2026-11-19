import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventSettings } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const settings = await db
      .select()
      .from(eventSettings)
      .where(eq(eventSettings.eventId, context.event.id));

    return NextResponse.json({
      status: 'ok',
      event: {
        id: context.event.id,
        name: context.event.name,
      },
      settings,
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

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    // Strict RBAC: Requires 'event:update_settings' permission
    context.assertPermission('event:update_settings');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const [updated] = await db.transaction(async (tx) => {
      const [setting] = await tx
        .insert(eventSettings)
        .values({
          eventId: context.event.id,
          key,
          value,
          updatedBy: context.user.id,
        })
        .onConflictDoUpdate({
          target: [eventSettings.eventId, eventSettings.key],
          set: {
            value,
            updatedBy: context.user.id,
            updatedAt: new Date(),
          },
        })
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'event_settings:updated',
          entityType: 'event_settings',
          entityId: setting.id,
          details: { key },
        },
        tx
      );

      return [setting];
    });

    return NextResponse.json({
      status: 'ok',
      setting: updated,
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
