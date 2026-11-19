import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  events,
  organizations,
  eventWebsites,
  eventTickets,
  ticketPriceRules,
  eventSpeakers,
  speakers,
  eventTracks,
  eventSessions,
  sessionSpeakers,
  eventSponsors,
  eventExhibitors,
  registrationForms,
  registrationFormFields,
} from '@/db/schema/index';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { calculateTicketPricing } from '@/lib/ticketing/pricing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/events/[slug]
 * Public endpoint to retrieve published event microsite data.
 * Zero authentication required.
 * Strictly returns only published, non-sensitive event data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Event slug is required' }, { status: 400 });
    }

    // 1. Resolve event by slug
    const [event] = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        venue: events.venue,
        startDate: events.startDate,
        endDate: events.endDate,
        status: events.status,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Enforce publication check: draft / archived events are not publicly accessible
    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'This event is not currently published' },
        { status: 404 }
      );
    }

    // 2. Resolve organization details (public info only)
    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizations)
      .where(eq(organizations.id, event.organizationId))
      .limit(1);

    // 3. Resolve Website Builder configuration
    let [website] = await db
      .select()
      .from(eventWebsites)
      .where(eq(eventWebsites.eventId, event.id))
      .limit(1);

    if (!website) {
      website = {
        id: 'default',
        eventId: event.id,
        organizationId: event.organizationId,
        isPublished: true,
        theme: {
          primaryColor: '#2563eb',
          secondaryColor: '#4f46e5',
          accentColor: '#06b6d4',
          darkMode: false,
        },
        heroTitle: event.name,
        heroSubtitle: `Join us for ${event.name}. Register online today for official passes.`,
        heroCoverUrl: null,
        logoUrl: null,
        aboutText: null,
        sectionsConfig: [
          { id: 'about', title: 'About Event', isVisible: true, displayOrder: 0 },
          { id: 'tickets', title: 'Passes & Registration', isVisible: true, displayOrder: 1 },
          { id: 'speakers', title: 'Featured Speakers', isVisible: true, displayOrder: 2 },
          { id: 'agenda', title: 'Schedule & Sessions', isVisible: true, displayOrder: 3 },
          { id: 'sponsors', title: 'Partners & Sponsors', isVisible: true, displayOrder: 4 },
          { id: 'exhibitors', title: 'Exhibitors', isVisible: true, displayOrder: 5 },
          { id: 'contact', title: 'Venue & Contact', isVisible: true, displayOrder: 6 },
        ],
        contactEmail: null,
        contactPhone: null,
        address: event.venue,
        footerText: `© ${new Date().getFullYear()} ${event.name}. All rights reserved.`,
        socialLinks: {},
        seoTitle: event.name,
        seoDescription: `Official registration microsite for ${event.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 4. Resolve Public Tickets (excluding hidden, filtering on_sale/scheduled)
    const rawTickets = await db
      .select()
      .from(eventTickets)
      .where(and(
        eq(eventTickets.eventId, event.id),
        eq(eventTickets.visibility, 'public')
      ))
      .orderBy(asc(eventTickets.displayOrder));

    // Fetch active price rules for these tickets
    const ticketIds = rawTickets.map((t) => t.id);
    const activeRules = ticketIds.length > 0
      ? await db
          .select()
          .from(ticketPriceRules)
          .where(and(
            inArray(ticketPriceRules.ticketId, ticketIds),
            eq(ticketPriceRules.isActive, true)
          ))
      : [];

    const tickets = rawTickets.map((ticket) => {
      const rules = activeRules.filter((r) => r.ticketId === ticket.id);
      const pricing = calculateTicketPricing({
        unitPrice: parseFloat(ticket.price),
        quantity: 1,
        currency: ticket.currency,
        rules: rules.map((r) => ({
          ...r,
          discountValue: parseFloat(r.discountValue),
        })),
        ticketId: ticket.id,
      });

      const remaining = Math.max(0, ticket.totalQuantity - (ticket.soldQuantity + ticket.reservedQuantity));

      return {
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        ticketType: ticket.ticketType,
        category: ticket.category,
        basePrice: parseFloat(ticket.price),
        currentPrice: pricing.netPayableAmount,
        currency: ticket.currency,
        remainingQuantity: remaining,
        minPerOrder: ticket.minPerOrder,
        maxPerOrder: ticket.maxPerOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        status: ticket.status,
        rules: rules.map((r) => ({
          name: r.name,
          ruleType: r.ruleType,
          discountType: r.discountType,
          discountValue: parseFloat(r.discountValue),
        })),
      };
    });

    // 5. Resolve Speakers
    const speakerRows = await db
      .select({
        id: speakers.id,
        name: speakers.name,
        title: speakers.title,
        company: speakers.company,
        bio: speakers.bio,
        photoUrl: speakers.photoUrl,
        linkedinUrl: speakers.linkedinUrl,
        twitterUrl: speakers.twitterUrl,
        featured: eventSpeakers.featured,
        displayOrder: eventSpeakers.displayOrder,
      })
      .from(eventSpeakers)
      .innerJoin(speakers, eq(eventSpeakers.speakerId, speakers.id))
      .where(eq(eventSpeakers.eventId, event.id))
      .orderBy(desc(eventSpeakers.featured), asc(eventSpeakers.displayOrder));

    // 6. Resolve Tracks & Sessions
    const tracks = await db
      .select()
      .from(eventTracks)
      .where(eq(eventTracks.eventId, event.id))
      .orderBy(asc(eventTracks.displayOrder));

    const sessions = await db
      .select()
      .from(eventSessions)
      .where(eq(eventSessions.eventId, event.id))
      .orderBy(asc(eventSessions.startTime));

    const sessionIds = sessions.map((s) => s.id);
    const sessionSpeakerLinks = sessionIds.length > 0
      ? await db
          .select({
            sessionId: sessionSpeakers.sessionId,
            speakerId: speakers.id,
            name: speakers.name,
            title: speakers.title,
            company: speakers.company,
            photoUrl: speakers.photoUrl,
            role: sessionSpeakers.role,
          })
          .from(sessionSpeakers)
          .innerJoin(speakers, eq(sessionSpeakers.speakerId, speakers.id))
          .where(inArray(sessionSpeakers.sessionId, sessionIds))
      : [];

    const enrichedSessions = sessions.map((s) => ({
      id: s.id,
      trackId: s.trackId,
      title: s.title,
      description: s.description,
      sessionDate: s.sessionDate,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      capacity: s.capacity,
      tags: s.tags,
      speakers: sessionSpeakerLinks.filter((l) => l.sessionId === s.id),
    }));

    // 7. Resolve Sponsors
    const sponsors = await db
      .select()
      .from(eventSponsors)
      .where(eq(eventSponsors.eventId, event.id))
      .orderBy(asc(eventSponsors.displayOrder));

    // 8. Resolve Exhibitors
    const exhibitors = await db
      .select()
      .from(eventExhibitors)
      .where(eq(eventExhibitors.eventId, event.id))
      .orderBy(asc(eventExhibitors.name));

    // 9. Resolve Registration Form & Fields
    const [form] = await db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.eventId, event.id))
      .limit(1);

    const formFields = form
      ? await db
          .select()
          .from(registrationFormFields)
          .where(and(
            eq(registrationFormFields.formId, form.id),
            eq(registrationFormFields.isVisible, true)
          ))
          .orderBy(asc(registrationFormFields.displayOrder))
      : [];

    return NextResponse.json({
      success: true,
      event,
      organization: org,
      website,
      tickets,
      speakers: speakerRows,
      tracks,
      sessions: enrichedSessions,
      sponsors,
      exhibitors,
      registrationForm: {
        form,
        fields: formFields,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
