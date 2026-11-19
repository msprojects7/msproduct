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
import { eq, and, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sessionSpeakerInputSchema = z.object({
  speakerId: z.string().uuid('Invalid speaker ID'),
  role: z.enum(['keynote', 'speaker', 'panelist', 'moderator']).default('speaker'),
  displayOrder: z.number().int().min(0).default(0),
});

const sessionSchema = z.object({
  title: z.string().min(1, 'Session title is required').max(255),
  description: z.string().optional().nullable(),
  trackId: z.string().uuid('Invalid track ID').optional().nullable(),
  sessionDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  startTime: z.string().datetime('Start time must be a valid ISO datetime'),
  endTime: z.string().datetime('End time must be a valid ISO datetime'),
  room: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(0).optional().nullable(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).default('scheduled'),
  tags: z.array(z.string()).optional().default([]),
  speakers: z.array(sessionSpeakerInputSchema).optional().default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    // 1. Fetch sessions
    const sessions = await db
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
      .where(eq(eventSessions.eventId, context.event.id))
      .orderBy(asc(eventSessions.startTime), asc(eventSessions.title));

    // 2. Fetch speakers for all sessions in this event
    const sessionIds = sessions.map((s) => s.id);
    const sessionSpeakerMap: Record<
      string,
      Array<{
        id: string;
        name: string;
        title: string | null;
        company: string | null;
        photoUrl: string | null;
        role: string;
        displayOrder: number;
      }>
    > = {};

    if (sessionIds.length > 0) {
      const speakerRows = await db
        .select({
          sessionId: sessionSpeakers.sessionId,
          role: sessionSpeakers.role,
          displayOrder: sessionSpeakers.displayOrder,
          speakerId: speakers.id,
          name: speakers.name,
          title: speakers.title,
          company: speakers.company,
          photoUrl: speakers.photoUrl,
        })
        .from(sessionSpeakers)
        .innerJoin(speakers, eq(sessionSpeakers.speakerId, speakers.id))
        .orderBy(asc(sessionSpeakers.displayOrder), asc(speakers.name));

      for (const row of speakerRows) {
        if (!sessionSpeakerMap[row.sessionId]) {
          sessionSpeakerMap[row.sessionId] = [];
        }
        sessionSpeakerMap[row.sessionId].push({
          id: row.speakerId,
          name: row.name,
          title: row.title,
          company: row.company,
          photoUrl: row.photoUrl,
          role: row.role,
          displayOrder: row.displayOrder,
        });
      }
    }

    const populatedSessions = sessions.map((session) => ({
      ...session,
      effectiveRoom: session.room || session.trackRoom || 'Unassigned',
      speakers: sessionSpeakerMap[session.id] || [],
    }));

    return NextResponse.json({ success: true, sessions: populatedSessions });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching event sessions:', err);
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
    const validated = sessionSchema.parse(body);

    const startTime = new Date(validated.startTime);
    const endTime = new Date(validated.endTime);

    // Rule 1: Session end time must be after start time
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'Session end time must be strictly after the start time' },
        { status: 400 }
      );
    }

    // Rule 2: Sessions must fall within event dates (if event has dates configured)
    if (context.event.startDate) {
      const eventStart = new Date(context.event.startDate);
      if (startTime < eventStart) {
        return NextResponse.json(
          { error: `Session start time cannot precede the event start date (${eventStart.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    if (context.event.endDate) {
      const eventEnd = new Date(context.event.endDate);
      // Allow session up to end of the event end date
      const eventEndBoundary = new Date(eventEnd.getTime() + 24 * 60 * 60 * 1000);
      if (endTime > eventEndBoundary) {
        return NextResponse.json(
          { error: `Session end time cannot exceed the event end date (${eventEnd.toLocaleDateString()})` },
          { status: 400 }
        );
      }
    }

    // Rule 3: Validate track ownership against current event
    let trackRoomName: string | null = null;
    if (validated.trackId) {
      const [track] = await db
        .select()
        .from(eventTracks)
        .where(
          and(
            eq(eventTracks.id, validated.trackId),
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

    // Rule 4: Validate room conflicts in the same room/track
    const effectiveRoom = validated.room?.trim() || trackRoomName?.trim() || null;

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
        .where(eq(eventSessions.eventId, context.event.id));

      for (const existing of existingSessions) {
        const otherEffectiveRoom = existing.room?.trim() || existing.trackRoom?.trim() || null;
        if (
          otherEffectiveRoom &&
          otherEffectiveRoom.toLowerCase() === effectiveRoom.toLowerCase()
        ) {
          // Check time overlap: existing.start < new.end && existing.end > new.start
          const exStart = new Date(existing.startTime);
          const exEnd = new Date(existing.endTime);

          if (exStart < endTime && exEnd > startTime) {
            return NextResponse.json(
              {
                error: `Room conflict: '${effectiveRoom}' is already occupied by session '${existing.title}' between ${exStart.toLocaleTimeString()} and ${exEnd.toLocaleTimeString()}`,
                code: 'ROOM_CONFLICT',
              },
              { status: 409 }
            );
          }
        }
      }
    }

    // Rule 5: Validate speaker ownership against current organization
    if (validated.speakers && validated.speakers.length > 0) {
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

    // 6. Create session
    const [newSession] = await db
      .insert(eventSessions)
      .values({
        eventId: context.event.id,
        trackId: validated.trackId || null,
        title: validated.title.trim(),
        description: validated.description?.trim() || null,
        sessionDate: validated.sessionDate ? new Date(validated.sessionDate) : startTime,
        startTime,
        endTime,
        room: validated.room?.trim() || null,
        capacity: validated.capacity || null,
        status: validated.status,
        tags: validated.tags,
      })
      .returning();

    // 7. Associate speakers to session and guarantee they are linked to event
    if (validated.speakers && validated.speakers.length > 0) {
      for (const sp of validated.speakers) {
        await db.insert(sessionSpeakers).values({
          sessionId: newSession.id,
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
      action: 'session:create',
      entityType: 'event_session',
      entityId: newSession.id,
      details: {
        title: newSession.title,
        trackId: newSession.trackId,
        room: effectiveRoom,
        speakersCount: validated.speakers.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error creating event session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
