import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventTracks } from '@/db/schema/index';
import { eq, and, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackSchema = z.object({
  name: z.string().min(1, 'Track name is required').max(100),
  roomName: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(0).optional().default(0),
  color: z.string().max(30).optional().default('#3B82F6'),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const tracks = await db
      .select()
      .from(eventTracks)
      .where(eq(eventTracks.eventId, context.event.id))
      .orderBy(asc(eventTracks.displayOrder), asc(eventTracks.name));

    return NextResponse.json({ success: true, tracks });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching tracks:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = trackSchema.parse(body);

    // Check duplicate track name for this event
    const [existing] = await db
      .select()
      .from(eventTracks)
      .where(
        and(
          eq(eventTracks.eventId, context.event.id),
          eq(eventTracks.name, validated.name.trim())
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Track with name '${validated.name}' already exists in this event` },
        { status: 409 }
      );
    }

    const [newTrack] = await db
      .insert(eventTracks)
      .values({
        eventId: context.event.id,
        name: validated.name.trim(),
        roomName: validated.roomName?.trim() || null,
        capacity: validated.capacity || 0,
        color: validated.color || '#3B82F6',
        displayOrder: validated.displayOrder || 0,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'track:create',
      entityType: 'event_track',
      entityId: newTrack.id,
      details: { name: newTrack.name, roomName: newTrack.roomName },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error creating track:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
