import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { events, attendees, attendeeAccessTokens } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const magicLinkSchema = z.object({
  email: z.string().email(),
  eventSlug: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = magicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email and event slug are required', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, eventSlug } = parsed.data;

    // Find event
    const [event] = await db
      .select({ id: events.id, name: events.name, slug: events.slug })
      .from(events)
      .where(eq(events.slug, eventSlug))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find attendee by email within this event (case-insensitive email matching)
    const [attendee] = await db
      .select()
      .from(attendees)
      .where(and(eq(attendees.eventId, event.id), eq(attendees.email, email.toLowerCase())))
      .limit(1);

    if (!attendee) {
      // Don't reveal attendee existence if not found; return generic success or informative message
      return NextResponse.json({
        success: true,
        message: 'If a registration exists for this email, access link instructions have been prepared.',
      });
    }

    // Generate secure random access token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(attendeeAccessTokens).values({
      attendeeId: attendee.id,
      eventId: event.id,
      tokenHash,
      tokenValue: rawToken.substring(0, 8) + '...',
      expiresAt,
    });

    const portalUrl = `/p/${event.slug}/attendee?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      message: 'Access token generated successfully',
      portalUrl,
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      attendee: {
        id: attendee.id,
        name: attendee.name,
        registrationNumber: attendee.registrationNumber,
      },
    });
  } catch (error: unknown) {
    console.error('Error generating attendee magic link:', error);
    return NextResponse.json(
      { error: 'Internal server error processing access link' },
      { status: 500 }
    );
  }
}
