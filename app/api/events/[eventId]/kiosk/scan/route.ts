import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { kioskSessions, events } from '@/db/schema/index';
import { eq, and, gt } from 'drizzle-orm';
import { executeCheckInOperation } from '@/lib/attendance/checkin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const kioskScanSchema = z.object({
  qrToken: z.string().trim().optional().nullable(),
  registrationNumber: z.string().trim().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const kioskToken =
      request.headers.get('x-kiosk-token') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!kioskToken) {
      return NextResponse.json(
        { error: 'Kiosk session token is required (x-kiosk-token)' },
        { status: 401 }
      );
    }

    // Verify kiosk session
    const [kiosk] = await db
      .select()
      .from(kioskSessions)
      .where(
        and(
          eq(kioskSessions.sessionToken, kioskToken.trim()),
          eq(kioskSessions.eventId, params.eventId),
          eq(kioskSessions.isActive, true),
          gt(kioskSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!kiosk) {
      return NextResponse.json(
        { error: 'Invalid or expired kiosk session' },
        { status: 401 }
      );
    }

    // Update lastActiveAt
    await db
      .update(kioskSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(kioskSessions.id, kiosk.id));

    // Resolve event for organizationId
    const [event] = await db
      .select({ id: events.id, organizationId: events.organizationId, name: events.name })
      .from(events)
      .where(eq(events.id, params.eventId))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = kioskScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid scan input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { qrToken, registrationNumber } = parsed.data;

    const result = await executeCheckInOperation({
      eventId: event.id,
      organizationId: event.organizationId,
      operatorUserId: `kiosk:${kiosk.kioskName}`,
      qrToken,
      registrationNumber,
      action: 'check_in',
      deviceInfo: `Kiosk Desk: ${kiosk.kioskName}`,
      isOverride: false,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    if (!result.success) {
      const statusCode = result.code === 'ALREADY_CHECKED_IN' ? 409 : 400;
      return NextResponse.json(
        {
          success: false,
          code: result.code,
          message: result.message,
          attendee: result.attendee
            ? {
                name: result.attendee.name,
                registrationNumber: result.attendee.registrationNumber,
                category: result.attendee.category,
              }
            : null,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to ${event.name}!`,
      attendee: {
        name: result.attendee?.name,
        registrationNumber: result.attendee?.registrationNumber,
        category: result.attendee?.category,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
  } catch (error: unknown) {
    console.error('Error handling kiosk scan:', error);
    return NextResponse.json(
      { error: 'Internal server error processing kiosk scan' },
      { status: 500 }
    );
  }
}
