import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { kioskSessions } from '@/db/schema/index';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createKioskSchema = z.object({
  kioskName: z.string().trim().min(2).max(100),
  durationHours: z.number().int().min(1).max(168).default(24), // 1 hour to 7 days
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_kiosk');

    const sessions = await db
      .select({
        id: kioskSessions.id,
        kioskName: kioskSessions.kioskName,
        sessionToken: kioskSessions.sessionToken,
        isActive: kioskSessions.isActive,
        lastActiveAt: kioskSessions.lastActiveAt,
        expiresAt: kioskSessions.expiresAt,
        createdAt: kioskSessions.createdAt,
      })
      .from(kioskSessions)
      .where(eq(kioskSessions.eventId, context.event.id))
      .orderBy(desc(kioskSessions.createdAt));

    return NextResponse.json({ sessions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_kiosk');

    const body = await request.json().catch(() => null);
    const parsed = createKioskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid kiosk parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { kioskName, durationHours } = parsed.data;
    const token = `ksk_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

    const [newSession] = await db
      .insert(kioskSessions)
      .values({
        eventId: context.event.id,
        kioskName,
        sessionToken: token,
        isActive: true,
        expiresAt,
        createdById: context.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Kiosk session activated',
      session: {
        id: newSession.id,
        kioskName: newSession.kioskName,
        sessionToken: newSession.sessionToken,
        expiresAt: newSession.expiresAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_kiosk');

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    await db
      .update(kioskSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(kioskSessions.id, sessionId),
          eq(kioskSessions.eventId, context.event.id)
        )
      );

    return NextResponse.json({ success: true, message: 'Kiosk session deactivated' });
  } catch (error) {
    return handleApiError(error);
  }
}
