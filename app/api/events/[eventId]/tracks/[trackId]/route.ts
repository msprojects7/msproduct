import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventTracks } from '@/db/schema/index';
import { eq, and, ne } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateTrackSchema = z.object({
  name: z.string().min(1, 'Track name is required').max(100).optional(),
  roomName: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(0).optional(),
  color: z.string().max(30).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; trackId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = updateTrackSchema.parse(body);

    const [existing] = await db
      .select()
      .from(eventTracks)
      .where(
        and(
          eq(eventTracks.id, params.trackId),
          eq(eventTracks.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (validated.name && validated.name.trim() !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(eventTracks)
        .where(
          and(
            eq(eventTracks.eventId, context.event.id),
            eq(eventTracks.name, validated.name.trim()),
            ne(eventTracks.id, params.trackId)
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { error: `Another track with name '${validated.name}' already exists in this event` },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(eventTracks)
      .set({
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.roomName !== undefined ? { roomName: validated.roomName?.trim() || null } : {}),
        ...(validated.capacity !== undefined ? { capacity: validated.capacity } : {}),
        ...(validated.color !== undefined ? { color: validated.color } : {}),
        ...(validated.displayOrder !== undefined ? { displayOrder: validated.displayOrder } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventTracks.id, params.trackId),
          eq(eventTracks.eventId, context.event.id)
        )
      )
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'track:update',
      entityType: 'event_track',
      entityId: updated.id,
      details: { updatedFields: Object.keys(validated) },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, track: updated });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating track:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; trackId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const [existing] = await db
      .select()
      .from(eventTracks)
      .where(
        and(
          eq(eventTracks.id, params.trackId),
          eq(eventTracks.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    await db
      .delete(eventTracks)
      .where(
        and(
          eq(eventTracks.id, params.trackId),
          eq(eventTracks.eventId, context.event.id)
        )
      );

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'track:delete',
      entityType: 'event_track',
      entityId: params.trackId,
      details: { name: existing.name },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Track deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error deleting track:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
