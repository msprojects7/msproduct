import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  ticketDocuments,
  attendees,
  events,
  organizations,
  registrationOrders,
  eventTickets,
} from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { generateTicketPdf } from '@/lib/tickets/pdf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/tickets/download/[ticketToken]
 * Public endpoint to download verified vector PDF ticket.
 * Token is a secure unguessable UUID generated on confirmation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticketToken: string } }
) {
  try {
    const ticketToken = params.ticketToken;
    if (!ticketToken) {
      return NextResponse.json({ error: 'Ticket token is required' }, { status: 400 });
    }

    // 1. Resolve ticket document
    const [doc] = await db
      .select()
      .from(ticketDocuments)
      .where(eq(ticketDocuments.ticketToken, ticketToken))
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: 'Ticket not found or invalid' }, { status: 404 });
    }

    // 2. Resolve attendee
    const [attendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, doc.attendeeId))
      .limit(1);

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee record not found' }, { status: 404 });
    }

    // 3. Resolve event and organization
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, doc.eventId))
      .limit(1);

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, event.organizationId))
      .limit(1);

    // 4. Resolve order and ticket name
    const [order] = await db
      .select()
      .from(registrationOrders)
      .where(eq(registrationOrders.id, doc.orderId))
      .limit(1);

    const [ticket] = order
      ? await db
          .select({ name: eventTickets.name })
          .from(eventTickets)
          .where(eq(eventTickets.id, order.ticketId))
          .limit(1)
      : [null];

    const formattedStartDate = event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    // 5. Generate binary PDF ticket
    const pdfBuffer = generateTicketPdf({
      eventName: event.name,
      organizationName: org?.name || 'MS Backstage',
      attendeeName: attendee.name,
      registrationNumber: attendee.registrationNumber,
      category: attendee.category,
      ticketName: ticket?.name || `${attendee.category} Pass`,
      venue: event.venue,
      startDate: formattedStartDate,
      qrToken: String(attendee.qrToken),
      orderNumber: order?.orderNumber || 'PASS',
    });

    const safeRegNo = attendee.registrationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Ticket-${safeRegNo}.pdf"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
