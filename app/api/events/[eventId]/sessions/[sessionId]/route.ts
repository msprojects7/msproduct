import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import {
  eventSessions,
  eventTracks,
  sessionSpeakers,
  speakers,
  eventSpeakers,
} from '@/db/schema/index';
import { eq, and, ne } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sessionSpeakerInputSchema = z.object({
  speakerId: z.string().uuid('Invalid speaker ID'),
  role: z.enum(['keynote', 'speaker', 'panelist', 'moderator']).default('speaker'),
  displayOrder: z.number().int().min(0).default(0),
});

const updateSessionSchema = z.object({
  title: z.string().min(1, 'Session title is required').max(255).optional(),
  description: z.string().optional().nullable(),
  trackId: z.string().uuid('Invalid track ID').optional().nullable(),
  sessionDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  startTime: z.string().datetime('Start time must be a valid ISO datetime').optional(),
  endTime: z.string().datetime('End time must be a valid ISO datetime').optional(),
  room: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(0).optional().nullable(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
  tags: z.array(z.string()).optional(),
  speakers: z.array(sessionSpeakerInputSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; sessionId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [session] = await db
      .select({
        id: eventSessions.id,
        eventId: eventSessions.eventId,
        trackId: eventSessions.trackId,
        title: eventSessions.title,
        description: eventSessions.description,
        sessionDate: eventSessions.sessionDate,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
        room: eventSessions.room,
        capacity: eventSessions.capacity,
        status: eventSessions.status,
        tags: eventSessions.tags,
        createdAt: eventSessions.createdAt,
        updatedAt: eventSessions.updatedAt,
        trackName: eventTracks.name,
        trackColor: eventTracks.color,
        trackRoom: eventTracks.roomName,
      })
      .from(eventSessions)
      .leftJoin(eventTracks, eq(eventSessions.trackId, eventTracks.id))
      .where(
        and(
          eq(eventSessions.id, params.sessionId),
          eq(eventSessions.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const speakerRows = await db
      .select({
        speakerId: speakers.id,
        name: speakers.name,
        title: speakers.title,
        company: speakers.company,
        photoUrl: speakers.photoUrl,
        role: sessionSpeakers.role,
        displayOrder: sessionSpeakers.displayOrder,
      })
      .from(sessionSpeakers)
      .innerJoin(speakers, eq(sessionSpeakers.speakerId, speakers.id))
      .where(eq(sessionSpeakers.sessionId, params.sessionId));

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        effectiveRoom: session.room || session.trackRoom || 'Unassigned',
        speakers: speakerRows,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; sessionId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = updateSessionSchema.parse(body);

    const [existing] = await db
      .select()
      .from(eventSessions)
      .where(
        and(
          eq(eventSessions.id, params.sessionId),
          eq(eventSessions.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const startTime = validated.startTime ? new Date(validated.startTime) : new Date(existing.startTime);
    const endTime = validated.endTime ? new Date(validated.endTime) : new Date(existing.endTime);

    // Rule 1: End time must be after start time
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'Session end time must be strictly after the start time' },
        { status: 400 }
      );
    }

    // Rule 2: Within event dates
    if (context.event.startDate) {
      const eventStart = new Date(context.event.startDate);
      if (startTime < eventStart) {
        return NextResponse.json(
          { error: `Session start time cannot precede event start date (${eventStart.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    if (context.event.endDate) {
      const eventEnd = new Date(context.event.endDate);
      const eventEndBoundary = new Date(eventEnd.getTime() + 24 * 60 * 60 * 1000);
      if (endTime > eventEndBoundary) {
        return NextResponse.json(
          { error: `Session end time cannot exceed event end date (${eventEnd.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    // Rule 3: Validate track ownership
    const targetTrackId = validated.trackId !== undefined ? validated.trackId : existing.trackId;
    let trackRoomName: string | null = null;
    if (targetTrackId) {
      const [track] = await db
        .select()
        .from(eventTracks)
        .where(
          and(
            eq(eventTracks.id, targetTrackId),
            eq(eventTracks.eventId, context.event.id)
          )
        )
        .limit(1);

      if (!track) {
        return NextResponse.json(
          { error: 'Assigned track does not belong to this event' },
          { status: 400 }
        );
      }
      trackRoomName = track.roomName;
    }

    // Rule 4: Room conflict validation
    const effectiveRoom = (validated.room !== undefined ? validated.room : existing.room)?.trim() || trackRoomName?.trim() || null;

    if (effectiveRoom) {
      const existingSessions = await db
        .select({
          id: eventSessions.id,
          title: eventSessions.title,
          room: eventSessions.room,
          startTime: eventSessions.startTime,
          endTime: eventSessions.endTime,
          trackRoom: eventTracks.roomName,
        })
        .from(eventSessions)
        .leftJoin(eventTracks, eq(eventSessions.trackId, eventTracks.id))
        .where(
          and(
            eq(eventSessions.eventId, context.event.id),
            ne(eventSessions.id, params.sessionId)
          )
        );

      for (const other of existingSessions) {
        const otherEffectiveRoom = other.room?.trim() || other.trackRoom?.trim() || null;
        if (
          otherEffectiveRoom &&
          otherEffectiveRoom.toLowerCase() === effectiveRoom.toLowerCase()
        ) {
          const exStart = new Date(other.startTime);
          const exEnd = new Date(other.endTime);

          if (exStart < endTime && exEnd > startTime) {
            return NextResponse.json(
              {
                error: `Room conflict: '${effectiveRoom}' is already occupied by session '${other.title}' between ${exStart.toLocaleTimeString()} and ${exEnd.toLocaleTimeString()}`,
                code: 'ROOM_CONFLICT',
              },
              { status: 409 }
            );
          }
        }
      }
    }

    // Rule 5: Validate speaker ownership
    if (validated.speakers !== undefined && validated.speakers.length > 0) {
      const speakerIds = validated.speakers.map((s) => s.speakerId);
      const orgSpeakers = await db
        .select({ id: speakers.id })
        .from(speakers)
        .where(eq(speakers.organizationId, context.organization.id));

      const validOrgSpeakerIds = new Set(orgSpeakers.map((s) => s.id));
      for (const sId of speakerIds) {
        if (!validOrgSpeakerIds.has(sId)) {
          return NextResponse.json(
            { error: `Speaker ID '${sId}' does not belong to this organization` },
            { status: 400 }
          );
        }
      }
    }

    // Update session table
    const [updatedSession] = await db
      .update(eventSessions)
      .set({
        ...(validated.title !== undefined ? { title: validated.title.trim() } : {}),
        ...(validated.description !== undefined ? { description: validated.description?.trim() || null } : {}),
        ...(validated.trackId !== undefined ? { trackId: validated.trackId } : {}),
        ...(validated.sessionDate !== undefined ? { sessionDate: validated.sessionDate ? new Date(validated.sessionDate) : startTime } : {}),
        ...(validated.startTime !== undefined ? { startTime } : {}),
        ...(validated.endTime !== undefined ? { endTime } : {}),
        ...(validated.room !== undefined ? { room: validated.room?.trim() || null } : {}),
        ...(validated.capacity !== undefined ? { capacity: validated.capacity } : {}),
        ...(validated.status !== undefined ? { status: validated.status } : {}),
        ...(validated.tags !== undefined ? { tags: validated.tags } : {}),
        updatedAt: new Date(),
      })
      .where(eq(eventSessions.id, params.sessionId))
      .returning();

    // Re-sync speakers if provided
    if (validated.speakers !== undefined) {
      await db.delete(sessionSpeakers).where(eq(sessionSpeakers.sessionId, params.sessionId));

      for (const sp of validated.speakers) {
        await db.insert(sessionSpeakers).values({
          sessionId: params.sessionId,
          speakerId: sp.speakerId,
          role: sp.role,
          displayOrder: sp.displayOrder,
        });

        // Ensure speaker is also listed in event_speakers
        const [existingLink] = await db
          .select()
          .from(eventSpeakers)
          .where(
            and(
              eq(eventSpeakers.eventId, context.event.id),
              eq(eventSpeakers.speakerId, sp.speakerId)
            )
          )
          .limit(1);

        if (!existingLink) {
          await db.insert(eventSpeakers).values({
            eventId: context.event.id,
            speakerId: sp.speakerId,
            featured: false,
            displayOrder: 0,
          });
        }
      }
    }

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'session:update',
      entityType: 'event_session',
      entityId: updatedSession.id,
      details: { title: updatedSession.title, updatedFields: Object.keys(validated) },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; sessionId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const [existing] = await db
      .select()
      .from(eventSessions)
      .where(
        and(
          eq(eventSessions.id, params.sessionId),
          eq(eventSessions.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db.delete(eventSessions).where(eq(eventSessions.id, params.sessionId));

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'session:delete',
      entityType: 'event_session',
      entityId: params.sessionId,
      details: { title: existing.title },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error deleting session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
