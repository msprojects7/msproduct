import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import {
  events,
  attendees,
  attendeeAccessTokens,
  attendeePreferences,
  ticketDocuments,
  sessionAttendance,
  eventSessions,
  issuedCertificates,
} from '@/db/schema/index';
import { eq, and, gt, desc } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
      searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Attendee access token is required' },
        { status: 401 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Find valid token
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

    // Load attendee & event
    const [attendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, tokenRecord.attendeeId))
      .limit(1);

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee profile not found' }, { status: 404 });
    }

    const [event] = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        startDate: events.startDate,
        endDate: events.endDate,
        venue: events.venue,
        status: events.status,
      })
      .from(events)
      .where(eq(events.id, tokenRecord.eventId))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Load preferences
    const [preferences] = await db
      .select()
      .from(attendeePreferences)
      .where(
        and(
          eq(attendeePreferences.attendeeId, attendee.id),
          eq(attendeePreferences.eventId, event.id)
        )
      )
      .limit(1);

    // Load ticket document
    const [ticketDoc] = await db
      .select()
      .from(ticketDocuments)
      .where(
        and(
          eq(ticketDocuments.attendeeId, attendee.id),
          eq(ticketDocuments.eventId, event.id)
        )
      )
      .limit(1);

    // Load session attendance
    const attendedSessions = await db
      .select({
        id: sessionAttendance.id,
        sessionId: sessionAttendance.sessionId,
        action: sessionAttendance.action,
        scannedAt: sessionAttendance.scannedAt,
        sessionTitle: eventSessions.title,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
        room: eventSessions.room,
      })
      .from(sessionAttendance)
      .leftJoin(eventSessions, eq(sessionAttendance.sessionId, eventSessions.id))
      .where(
        and(
          eq(sessionAttendance.attendeeId, attendee.id),
          eq(sessionAttendance.eventId, event.id)
        )
      )
      .orderBy(desc(sessionAttendance.scannedAt));

    // Load issued certificates
    const certificates = await db
      .select({
        id: issuedCertificates.id,
        certificateReference: issuedCertificates.certificateReference,
        status: issuedCertificates.status,
        issuedAt: issuedCertificates.issuedAt,
      })
      .from(issuedCertificates)
      .where(
        and(
          eq(issuedCertificates.attendeeId, attendee.id),
          eq(issuedCertificates.eventId, event.id),
          eq(issuedCertificates.status, 'valid')
        )
      );

    return NextResponse.json({
      attendee: {
        id: attendee.id,
        name: attendee.name,
        registrationNumber: attendee.registrationNumber,
        email: attendee.email,
        phoneNumber: attendee.phoneNumber,
        category: attendee.category,
        foodPreference: attendee.foodPreference,
        attendanceStatus: attendee.attendanceStatus,
        paymentStatus: attendee.paymentStatus,
        qrToken: attendee.qrToken,
        createdAt: attendee.createdAt,
      },
      event,
      preferences: preferences || {
        preferredName: attendee.name,
        badgeOrganization: '',
        dietaryRequirements: attendee.foodPreference,
        accessibilityNeeds: '',
      },
      ticket: ticketDoc
        ? {
            ticketToken: ticketDoc.ticketToken,
            pdfDownloadUrl: ticketDoc.downloadUrl || `/api/public/events/${event.slug}/tickets/${ticketDoc.ticketToken}/download`,
            status: ticketDoc.status,
          }
        : null,
      attendedSessions,
      certificates,
    });
  } catch (error: unknown) {
    console.error('Error fetching attendee portal:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching attendee portal' },
      { status: 500 }
    );
  }
}
