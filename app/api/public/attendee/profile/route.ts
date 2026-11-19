import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import {
  attendeeAccessTokens,
  attendeePreferences,
  attendees,
} from '@/db/schema/index';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  preferredName: z.string().trim().max(255).optional(),
  badgeOrganization: z.string().trim().max(255).optional(),
  dietaryRequirements: z.string().trim().max(500).optional(),
  accessibilityNeeds: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Attendee access token is required' },
        { status: 401 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [tokenRecord] = await db
      .select()
      .from(attendeeAccessTokens)
      .where(
        and(
          eq(attendeeAccessTokens.tokenHash, tokenHash),
          gt(attendeeAccessTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { preferredName, badgeOrganization, dietaryRequirements, accessibilityNeeds } = parsed.data;

    // Check if preference record exists
    const [existing] = await db
      .select()
      .from(attendeePreferences)
      .where(
        and(
          eq(attendeePreferences.attendeeId, tokenRecord.attendeeId),
          eq(attendeePreferences.eventId, tokenRecord.eventId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(attendeePreferences)
        .set({
          preferredName: preferredName !== undefined ? preferredName : existing.preferredName,
          badgeOrganization: badgeOrganization !== undefined ? badgeOrganization : existing.badgeOrganization,
          dietaryRequirements: dietaryRequirements !== undefined ? dietaryRequirements : existing.dietaryRequirements,
          accessibilityNeeds: accessibilityNeeds !== undefined ? accessibilityNeeds : existing.accessibilityNeeds,
          updatedAt: new Date(),
        })
        .where(eq(attendeePreferences.id, existing.id));
    } else {
      await db.insert(attendeePreferences).values({
        attendeeId: tokenRecord.attendeeId,
        eventId: tokenRecord.eventId,
        preferredName: preferredName || null,
        badgeOrganization: badgeOrganization || null,
        dietaryRequirements: dietaryRequirements || null,
        accessibilityNeeds: accessibilityNeeds || null,
      });
    }

    // Also update dietary requirements in attendees table if provided
    if (dietaryRequirements) {
      await db
        .update(attendees)
        .set({ foodPreference: dietaryRequirements, updatedAt: new Date() })
        .where(eq(attendees.id, tokenRecord.attendeeId));
    }

    return NextResponse.json({
      success: true,
      message: 'Attendee preferences updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating attendee profile:', error);
    return NextResponse.json(
      { error: 'Internal server error updating preferences' },
      { status: 500 }
    );
  }
}
