import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { speakers, eventSpeakers, sessionSpeakers, eventSessions } from '@/db/schema/index';
import { eq, and, asc, desc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const linkSpeakerSchema = z.object({
  speakerId: z.string().uuid('Invalid speaker ID'),
  featured: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
});

const createAndLinkSpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name is required').max(255),
  title: z.string().max(255).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  photoUrl: z.string().url('Invalid photo URL').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter/X URL').optional().nullable().or(z.literal('')),
  featured: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    // Fetch event speakers joined with speaker profile
    const eventSpeakerRows = await db
      .select({
        associationId: eventSpeakers.id,
        featured: eventSpeakers.featured,
        displayOrder: eventSpeakers.displayOrder,
        linkedAt: eventSpeakers.createdAt,
        id: speakers.id,
        organizationId: speakers.organizationId,
        name: speakers.name,
        title: speakers.title,
        company: speakers.company,
        bio: speakers.bio,
        email: speakers.email,
        phone: speakers.phone,
        photoUrl: speakers.photoUrl,
        websiteUrl: speakers.websiteUrl,
        linkedinUrl: speakers.linkedinUrl,
        twitterUrl: speakers.twitterUrl,
      })
      .from(eventSpeakers)
      .innerJoin(speakers, eq(eventSpeakers.speakerId, speakers.id))
      .where(eq(eventSpeakers.eventId, context.event.id))
      .orderBy(desc(eventSpeakers.featured), asc(eventSpeakers.displayOrder), asc(speakers.name));

    // Also fetch sessions for each speaker in this event
    const speakerIds = eventSpeakerRows.map((s) => s.id);
    const sessionMap: Record<string, Array<{ id: string; title: string; startTime: Date; endTime: Date; role: string }>> = {};

    if (speakerIds.length > 0) {
      const sessionRows = await db
        .select({
          speakerId: sessionSpeakers.speakerId,
          role: sessionSpeakers.role,
          sessionId: eventSessions.id,
          title: eventSessions.title,
          startTime: eventSessions.startTime,
          endTime: eventSessions.endTime,
        })
        .from(sessionSpeakers)
        .innerJoin(eventSessions, eq(sessionSpeakers.sessionId, eventSessions.id))
        .where(eq(eventSessions.eventId, context.event.id));

      for (const row of sessionRows) {
        if (!sessionMap[row.speakerId]) {
          sessionMap[row.speakerId] = [];
        }
        sessionMap[row.speakerId].push({
          id: row.sessionId,
          title: row.title,
          startTime: row.startTime,
          endTime: row.endTime,
          role: row.role,
        });
      }
    }

    const result = eventSpeakerRows.map((s) => ({
      ...s,
      sessions: sessionMap[s.id] || [],
    }));

    return NextResponse.json({
      success: true,
      speakers: result,
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching event speakers:', err);
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

    let targetSpeakerId: string;
    let isFeatured = false;
    let order = 0;

    if (body.speakerId) {
      // 1. Link existing speaker from organization
      const validated = linkSpeakerSchema.parse(body);
      targetSpeakerId = validated.speakerId;
      isFeatured = validated.featured;
      order = validated.displayOrder;

      // Validate speaker belongs to the same organization as this event!
      const [speaker] = await db
        .select()
        .from(speakers)
        .where(
          and(
            eq(speakers.id, targetSpeakerId),
            eq(speakers.organizationId, context.organization.id)
          )
        )
        .limit(1);

      if (!speaker) {
        return NextResponse.json(
          { error: 'Speaker does not belong to this organization' },
          { status: 400 }
        );
      }
    } else {
      // 2. Create new speaker in organization and link to event
      const validated = createAndLinkSpeakerSchema.parse(body);
      isFeatured = validated.featured;
      order = validated.displayOrder;

      const [newSpeaker] = await db
        .insert(speakers)
        .values({
          organizationId: context.organization.id,
          name: validated.name.trim(),
          title: validated.title?.trim() || null,
          company: validated.company?.trim() || null,
          bio: validated.bio?.trim() || null,
          email: validated.email?.trim() || null,
          phone: validated.phone?.trim() || null,
          photoUrl: validated.photoUrl?.trim() || null,
          websiteUrl: validated.websiteUrl?.trim() || null,
          linkedinUrl: validated.linkedinUrl?.trim() || null,
          twitterUrl: validated.twitterUrl?.trim() || null,
        })
        .returning();

      targetSpeakerId = newSpeaker.id;
    }

    // Check if already linked
    const [existingLink] = await db
      .select()
      .from(eventSpeakers)
      .where(
        and(
          eq(eventSpeakers.eventId, context.event.id),
          eq(eventSpeakers.speakerId, targetSpeakerId)
        )
      )
      .limit(1);

    if (existingLink) {
      return NextResponse.json(
        { error: 'Speaker is already associated with this event' },
        { status: 409 }
      );
    }

    const [association] = await db
      .insert(eventSpeakers)
      .values({
        eventId: context.event.id,
        speakerId: targetSpeakerId,
        featured: isFeatured,
        displayOrder: order,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'event_speaker:link',
      entityType: 'event_speaker',
      entityId: association.id,
      details: { speakerId: targetSpeakerId, featured: isFeatured },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json(
      {
        success: true,
        association,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error linking event speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
