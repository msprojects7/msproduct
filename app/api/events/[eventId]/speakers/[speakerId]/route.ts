import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventSpeakers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateEventSpeakerSchema = z.object({
  featured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; speakerId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = updateEventSpeakerSchema.parse(body);

    const [existing] = await db
      .select()
      .from(eventSpeakers)
      .where(
        and(
          eq(eventSpeakers.eventId, context.event.id),
          eq(eventSpeakers.speakerId, params.speakerId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Speaker is not linked to this event' }, { status: 404 });
    }

    const [updated] = await db
      .update(eventSpeakers)
      .set({
        ...(validated.featured !== undefined ? { featured: validated.featured } : {}),
        ...(validated.displayOrder !== undefined ? { displayOrder: validated.displayOrder } : {}),
      })
      .where(
        and(
          eq(eventSpeakers.eventId, context.event.id),
          eq(eventSpeakers.speakerId, params.speakerId)
        )
      )
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'event_speaker:update',
      entityType: 'event_speaker',
      entityId: updated.id,
      details: { speakerId: params.speakerId, ...validated },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, association: updated });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating event speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; speakerId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const [existing] = await db
      .select()
      .from(eventSpeakers)
      .where(
        and(
          eq(eventSpeakers.eventId, context.event.id),
          eq(eventSpeakers.speakerId, params.speakerId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Speaker is not linked to this event' }, { status: 404 });
    }

    await db
      .delete(eventSpeakers)
      .where(
        and(
          eq(eventSpeakers.eventId, context.event.id),
          eq(eventSpeakers.speakerId, params.speakerId)
        )
      );

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'event_speaker:unlink',
      entityType: 'event_speaker',
      entityId: existing.id,
      details: { speakerId: params.speakerId },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Speaker unlinked from event' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error unlinking event speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
