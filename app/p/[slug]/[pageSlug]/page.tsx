import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  ArrowLeft,
  Building2,
  ExternalLink,
} from 'lucide-react';
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
} from '@/db/schema/index';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { calculateTicketPricing } from '@/lib/ticketing/pricing';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    slug: string;
    pageSlug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [event] = await db
    .select({ id: events.id, name: events.name, venue: events.venue })
    .from(events)
    .where(eq(events.slug, params.slug))
    .limit(1);

  if (!event) return { title: 'Page Not Found | MS Backstage' };

  const pageTitle =
    params.pageSlug.charAt(0).toUpperCase() + params.pageSlug.slice(1).replace(/-/g, ' ');

  return {
    title: `${pageTitle} | ${event.name}`,
    description: `Official ${pageTitle} page for ${event.name}.`,
  };
}

export default async function PublicEventSubpage({ params }: Props) {
  const { slug, pageSlug } = params;

  // 1. Resolve Event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event || event.status !== 'published') {
    notFound();
  }

  // 2. Resolve Organization
  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, event.organizationId))
    .limit(1);

  // 3. Resolve Website Builder config
  const [website] = await db
    .select()
    .from(eventWebsites)
    .where(eq(eventWebsites.eventId, event.id))
    .limit(1);

  const theme = (website?.theme as {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    darkMode?: boolean;
    fontFamily?: string;
    heroBgColor?: string;
    heroTextColor?: string;
    heroSubtextColor?: string;
    cardBgColor?: string;
    cardTextColor?: string;
    cardBorderColor?: string;
    siteBgColor?: string;
    siteTextColor?: string;
    footerBgColor?: string;
    footerTextColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonBorderRadius?: string;
    pages?: Array<{
      id: string;
      slug: string;
      title: string;
      navLabel?: string;
      isHome?: boolean;
      isPublished?: boolean;
      customHeadline?: string;
      customDescription?: string;
    }>;
  }) || {
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    accentColor: '#06b6d4',
  };

  const fontFamilies: Record<string, string> = {
    times_new_roman: '"Times New Roman", Times, Georgia, serif',
    inter: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    roboto: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    playfair: '"Playfair Display", Georgia, serif',
    montserrat: 'Montserrat, "Segoe UI", sans-serif',
    poppins: 'Poppins, -apple-system, sans-serif',
    outfit: 'Outfit, system-ui, sans-serif',
    space_grotesk: '"Space Grotesk", monospace, sans-serif',
    plus_jakarta: '"Plus Jakarta Sans", sans-serif',
    jetbrains_mono: '"JetBrains Mono", Consolas, monospace',
  };
  const activeFontFamily = fontFamilies[theme.fontFamily || 'times_new_roman'] || fontFamilies.times_new_roman;

  // Resolve standard navigation tabs
  const defaultNavPages = [
    { slug: '', label: 'Overview' },
    { slug: 'about', label: 'About' },
    { slug: 'speakers', label: 'Speakers' },
    { slug: 'agenda', label: 'Schedule' },
    { slug: 'tickets', label: 'Passes' },
    { slug: 'venue', label: 'Venue & Travel' },
  ];

  const customPages = theme.pages || [];
  const activeCustomPage = customPages.find((p) => p.slug === pageSlug);

  // Known subpage types: 'about' | 'speakers' | 'agenda' | 'tickets' | 'venue' | custom
  const isKnownSubpage = ['about', 'speakers', 'agenda', 'tickets', 'venue'].includes(pageSlug);

  if (!isKnownSubpage && !activeCustomPage) {
    notFound();
  }

  // 4. Resolve Tickets if needed
  const rawTickets = await db
    .select()
    .from(eventTickets)
    .where(and(eq(eventTickets.eventId, event.id), eq(eventTickets.visibility, 'public')))
    .orderBy(asc(eventTickets.displayOrder));

  const ticketIds = rawTickets.map((t) => t.id);
  const activeRules =
    ticketIds.length > 0
      ? await db
          .select()
          .from(ticketPriceRules)
          .where(and(inArray(ticketPriceRules.ticketId, ticketIds), eq(ticketPriceRules.isActive, true)))
      : [];

  const tickets = rawTickets.map((ticket) => {
    const rules = activeRules.filter((r) => r.ticketId === ticket.id);
    const pricing = calculateTicketPricing({
      unitPrice: parseFloat(ticket.price),
      quantity: 1,
      currency: ticket.currency,
      rules: rules.map((r) => ({ ...r, discountValue: parseFloat(r.discountValue) })),
      ticketId: ticket.id,
    });
    const remaining = Math.max(0, ticket.totalQuantity - (ticket.soldQuantity + ticket.reservedQuantity));

    return {
      ...ticket,
      basePrice: parseFloat(ticket.price),
      currentPrice: pricing.netPayableAmount,
      ruleDiscount: pricing.ruleDiscountAmount,
      remainingQuantity: remaining,
      rules,
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
      featured: eventSpeakers.featured,
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

  const rawSessions = await db
    .select()
    .from(eventSessions)
    .where(eq(eventSessions.eventId, event.id))
    .orderBy(asc(eventSessions.startTime));

  const sessionIds = rawSessions.map((s) => s.id);
  const sessionLinks =
    sessionIds.length > 0
      ? await db
          .select({
            sessionId: sessionSpeakers.sessionId,
            name: speakers.name,
            title: speakers.title,
            company: speakers.company,
            photoUrl: speakers.photoUrl,
          })
          .from(sessionSpeakers)
          .innerJoin(speakers, eq(sessionSpeakers.speakerId, speakers.id))
          .where(inArray(sessionSpeakers.sessionId, sessionIds))
      : [];

  const sessions = rawSessions.map((s) => ({
    ...s,
    speakers: sessionLinks.filter((l) => l.sessionId === s.id),
  }));

  // 7. Resolve Sponsors
  const sponsors = await db
    .select()
    .from(eventSponsors)
    .where(eq(eventSponsors.eventId, event.id))
    .orderBy(asc(eventSponsors.displayOrder));

  const pageTitle = activeCustomPage?.title || pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1).replace(/-/g, ' ');
  const pageHeadline = activeCustomPage?.customHeadline || (
    pageSlug === 'about'
      ? 'Pioneering Ideas, Global Perspectives'
      : pageSlug === 'speakers'
      ? 'Distinguished Keynote Faculty'
      : pageSlug === 'agenda'
      ? 'Multi-Track Comprehensive Program'
      : pageSlug === 'tickets'
      ? 'Passes & Registration Options'
      : 'Venue Location & Access Guide'
  );
  const pageDescription = activeCustomPage?.customDescription || (
    pageSlug === 'about'
      ? website?.aboutText || 'Discover the strategic themes, foundational objectives, and convening mission.'
      : pageSlug === 'speakers'
      ? 'Learn from visionary founders, clinicians, architects, and international researchers.'
      : pageSlug === 'agenda'
      ? 'Explore keynote sessions, technical deep-dives, interactive panel discussions, and workshops.'
      : pageSlug === 'tickets'
      ? 'Select the ideal registration tier for individuals, students, or enterprise teams.'
      : `Complete travel guide, hall maps, and access coordinates for ${event.venue || 'the venue'}.`
  );

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200"
      style={{
        fontFamily: activeFontFamily,
        backgroundColor: theme.siteBgColor || undefined,
        color: theme.siteTextColor || undefined,
      }}
    >
      {/* 10 Web Fonts Google Stylesheet Link */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Montserrat:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap"
      />

      {/* Top Navbar with Multi-Page Tabs */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/p/${slug}`} className="flex items-center gap-3">
            {website?.logoUrl ? (
              <img src={website.logoUrl} alt={event.name} className="h-9 w-auto object-contain rounded" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm"
                style={{ backgroundColor: theme.buttonBgColor || theme.primaryColor || '#2563eb' }}
              >
                {event.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold text-sm sm:text-base text-white tracking-tight line-clamp-1">
                {event.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                {org?.name || 'Hosted Event'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={`/p/${slug}`}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              Overview
            </Link>
            {['about', 'speakers', 'agenda', 'tickets', 'venue'].map((tab) => (
              <Link
                key={tab}
                href={`/p/${slug}/${tab}`}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  pageSlug === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab === 'venue' ? 'Venue & Travel' : tab}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/p/${slug}/register`}
              className="px-4 py-2 text-xs font-bold text-white transition shadow-md"
              style={{
                backgroundColor: theme.buttonBgColor || theme.primaryColor || '#2563eb',
                color: theme.buttonTextColor || '#ffffff',
                borderRadius: theme.buttonBorderRadius || '12px',
              }}
            >
              Get Passes
            </Link>
          </div>
        </div>
      </header>

      {/* Subpage Hero Header Banner */}
      <section
        className="relative py-12 sm:py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 hero-dark-banner"
        style={{
          backgroundColor: theme.heroBgColor || undefined,
          color: theme.heroTextColor || '#ffffff',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-blue-400 mb-3 font-semibold">
            <Link href={`/p/${slug}`} className="hover:underline flex items-center gap-1 text-blue-400 hover:text-blue-300">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300 capitalize">{pageTitle}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ color: theme.heroTextColor || '#ffffff' }}>
            {pageHeadline}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed" style={{ color: theme.heroSubtextColor || '#cbd5e1' }}>
            {pageDescription}
          </p>
        </div>
      </section>

      {/* Subpage Content Bodies */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {/* VIEW 1: ABOUT PAGE */}
        {pageSlug === 'about' && (
          <div className="space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
              <h2 className="text-xl font-bold text-white">Event Purpose &amp; Overview</h2>
              <div className="prose prose-invert text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {website?.aboutText ||
                  `${event.name} brings together global industry leaders, domain researchers, and practicing professionals to exchange strategic methodologies, breakthrough case studies, and forward-looking research.`}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-blue-400 font-bold text-lg mb-1">Global Scope</div>
                  <p className="text-xs text-slate-400">
                    Featuring keynote presentations, breakout roundtables, and international peer networking.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-blue-400 font-bold text-lg mb-1">Accreditation</div>
                  <p className="text-xs text-slate-400">
                    Official verified certificates and professional development units issued automatically.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-blue-400 font-bold text-lg mb-1">Interactive Expo</div>
                  <p className="text-xs text-slate-400">
                    Hands-on exhibition booths, technology showcases, and direct partner demonstrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Host Organization Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Organizing Body
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{org?.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Responsible for program curation, speaker coordination, and event administration.
                </p>
              </div>
              <Link
                href={`/p/${slug}/tickets`}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md shrink-0"
              >
                Register for Passes
              </Link>
            </div>
          </div>
        )}

        {/* VIEW 2: SPEAKERS DIRECTORY */}
        {pageSlug === 'speakers' && (
          <div>
            {speakerRows.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Speaker lineup will be announced shortly. Check back soon for updates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {speakerRows.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center hover:border-slate-700 transition group"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 mb-4 group-hover:border-blue-500 transition">
                      {speaker.photoUrl ? (
                        <img
                          src={speaker.photoUrl}
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xl text-slate-400 bg-slate-800">
                          {speaker.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">
                      {speaker.name}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">{speaker.title}</p>
                    {speaker.company && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{speaker.company}</p>
                    )}
                    {speaker.bio && (
                      <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                        {speaker.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MULTI-TRACK AGENDA & SCHEDULE */}
        {pageSlug === 'agenda' && (
          <div className="space-y-6">
            {tracks.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                <span className="text-xs text-slate-400 py-1 font-semibold">Tracks:</span>
                {tracks.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Agenda details are currently being finalized.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-400 font-bold">
                          {session.startTime
                            ? new Date(session.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBD'}{' '}
                          -{' '}
                          {session.endTime
                            ? new Date(session.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBD'}
                        </span>
                        {session.room && (
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {session.room}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-white">{session.title}</h3>
                    {session.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {session.description}
                      </p>
                    )}

                    {session.speakers && session.speakers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/40">
                        {session.speakers.map((spk, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/50"
                          >
                            <Users className="w-3 h-3" />
                            <span>{spk.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: TICKETS & PRICING */}
        {pageSlug === 'tickets' && (
          <div>
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Passes will go on sale shortly. Contact the organizing committee for early registration.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-blue-500/60 transition shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {t.remainingQuantity > 0 ? `${t.remainingQuantity} left` : 'Sold Out'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{t.name}</h3>
                      {t.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                      )}

                      <div className="my-5">
                        <span className="text-3xl font-extrabold text-white">
                          ₹{t.currentPrice.toLocaleString()}
                        </span>
                        {t.ruleDiscount > 0 && (
                          <span className="text-xs text-slate-500 line-through ml-2">
                            ₹{t.basePrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 block mt-1">per attendee</span>
                      </div>
                    </div>

                    <Link
                      href={`/p/${slug}/register?ticket=${t.id}`}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl text-center shadow-lg shadow-blue-600/25 transition"
                    >
                      Select &amp; Register
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: VENUE & TRAVEL GUIDE */}
        {pageSlug === 'venue' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Venue Location &amp; Physical Address</span>
              </h2>
              <p className="text-base font-semibold text-white">
                {website?.address || event.venue || 'Main Convention Center'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                The venue features full accessibility compliance, multi-tier underground parking, high-speed attendee Wi-Fi, and dedicated shuttle connectivity from major transit hubs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">Contact Inquiries</h4>
                  <p className="text-xs text-slate-400">
                    Email: {website?.contactEmail || 'desk@msbackstage.internal'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Phone: {website?.contactPhone || '+91 98765 43210'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">Badge Collection Desk</h4>
                  <p className="text-xs text-slate-400">
                    Spot badge printing and physical accreditation kiosks will be open starting at 08:00 AM daily.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t border-slate-800/80 bg-slate-950 py-8 mt-16 text-center text-xs text-slate-500"
        style={{
          backgroundColor: theme.footerBgColor || undefined,
          color: theme.footerTextColor || undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {event.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href={`/p/${slug}`} className="hover:text-slate-400">Overview</Link>
            <Link href={`/p/${slug}/about`} className="hover:text-slate-400">About</Link>
            <Link href={`/p/${slug}/tickets`} className="hover:text-slate-400">Tickets</Link>
            <Link href={`/p/${slug}/venue`} className="hover:text-slate-400">Venue</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
