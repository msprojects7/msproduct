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
  Timer,
  HelpCircle,
  Award,
  LayoutGrid,
} from 'lucide-react';
import PublicMobileNav from '@/app/components/website/PublicMobileNav';
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
import { WebsiteThemeConfig, CustomSectionItem, getFontFamilyCss } from '@/lib/website/config';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [event] = await db
    .select({ id: events.id, name: events.name, venue: events.venue })
    .from(events)
    .where(eq(events.slug, params.slug))
    .limit(1);

  if (!event) return { title: 'Event Not Found | MS Backstage' };

  const [website] = await db
    .select()
    .from(eventWebsites)
    .where(eq(eventWebsites.eventId, event.id))
    .limit(1);

  const title = website?.seoTitle || `${event.name} | Official Passes & Registration`;
  const description =
    website?.seoDescription ||
    `Register online for ${event.name}. Browse schedule, featured speakers, and secure passes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function PublicEventMicrositePage({ params }: Props) {
  const slug = params.slug;

  // 1. Resolve event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event || event.status !== 'published') {
    notFound();
  }

  // 2. Resolve organization
  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, event.organizationId))
    .limit(1);

  // 3. Resolve Website Builder configuration
  const [website] = await db
    .select()
    .from(eventWebsites)
    .where(eq(eventWebsites.eventId, event.id))
    .limit(1);

  const theme = (website?.theme as WebsiteThemeConfig) || {
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

  const defaultSections: CustomSectionItem[] = [
    { id: 'about', title: 'About the Event', isVisible: true, displayOrder: 0 },
    { id: 'countdown', title: 'Opening Countdown', isVisible: true, displayOrder: 1 },
    { id: 'tickets', title: 'Passes & Registration', isVisible: true, displayOrder: 2 },
    { id: 'speakers', title: 'Featured Speakers', isVisible: true, displayOrder: 3 },
    { id: 'agenda', title: 'Schedule & Tracks', isVisible: true, displayOrder: 4 },
    { id: 'sponsors', title: 'Partners & Sponsors', isVisible: true, displayOrder: 5 },
    { id: 'exhibitors', title: 'Exhibitor Directory', isVisible: true, displayOrder: 6 },
    { id: 'faq', title: 'Frequently Asked Questions', isVisible: true, displayOrder: 7 },
    { id: 'contact', title: 'Venue & Contact', isVisible: true, displayOrder: 8 },
  ];

  const sections = (website?.sectionsConfig as CustomSectionItem[]) || defaultSections;
  const sortedSections = [...sections].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const isSectionVisible = (id: string) => {
    const sec = sections.find((s) => s.id === id);
    return sec ? sec.isVisible : true;
  };

  // 4. Resolve Tickets
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
    const unitPrice = parseFloat(ticket.price || '0') || 0;
    const pricing = calculateTicketPricing({
      unitPrice,
      quantity: 1,
      currency: ticket.currency || 'INR',
      rules: rules.map((r) => ({ ...r, discountValue: parseFloat(String(r.discountValue || '0')) || 0 })),
      ticketId: ticket.id,
    });
    const totalQty = ticket.totalQuantity ?? 0;
    const soldQty = ticket.soldQuantity ?? 0;
    const reservedQty = ticket.reservedQuantity ?? 0;
    const remaining = Math.max(0, totalQty - (soldQty + reservedQty));

    return {
      ...ticket,
      basePrice: unitPrice,
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

  // 8. Resolve Exhibitors
  const exhibitors = await db
    .select()
    .from(eventExhibitors)
    .where(eq(eventExhibitors.eventId, event.id))
    .orderBy(asc(eventExhibitors.name));

  const startDateFormatted = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const endDateFormatted = event.endDate
    ? new Date(event.endDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
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

      {/* Top Navbar */}
      <header
        className={`z-50 border-b transition-colors ${
          theme.headerSticky !== false ? 'sticky top-0 backdrop-blur-md' : 'relative'
        }`}
        style={{
          backgroundColor: theme.headerBgColor || (theme.darkMode ? 'rgba(9, 13, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
          borderColor: theme.headerBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
          borderBottomWidth: theme.headerBorderWidth !== undefined ? `${theme.headerBorderWidth}px` : undefined,
          color: theme.headerTextColor || undefined,
          boxShadow: theme.headerShadow === 'none' ? 'none' : theme.headerShadow === 'sm' ? '0 1px 2px 0 rgba(0,0,0,0.05)' : theme.headerShadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : theme.headerShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : undefined,
        }}
      >
        <div
          className="max-w-7xl mx-auto flex items-center justify-between"
          style={{
            height: theme.headerHeight ? `${theme.headerHeight}px` : '64px',
            paddingLeft: theme.headerPaddingX ? `${theme.headerPaddingX}px` : '16px',
            paddingRight: theme.headerPaddingX ? `${theme.headerPaddingX}px` : '16px',
            paddingTop: theme.headerPaddingY ? `${theme.headerPaddingY}px` : undefined,
            paddingBottom: theme.headerPaddingY ? `${theme.headerPaddingY}px` : undefined,
          }}
        >
          <div className="flex items-center gap-3">
            {website?.logoUrl ? (
              <img
                src={website.logoUrl}
                alt={event.name}
                className="rounded"
                style={{
                  width: theme.headerLogoWidth ? `${theme.headerLogoWidth}px` : undefined,
                  height: theme.headerLogoHeight ? `${theme.headerLogoHeight}px` : '36px',
                  objectFit: theme.headerLogoFit || 'contain',
                }}
              />
            ) : (
              <div
                className="rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm"
                style={{
                  backgroundColor: theme.headerCtaBg || theme.buttonBgColor || theme.primaryColor || '#2563eb',
                  width: theme.headerLogoWidth ? `${Math.min(theme.headerLogoWidth, 48)}px` : '36px',
                  height: theme.headerLogoHeight ? `${Math.min(theme.headerLogoHeight, 48)}px` : '36px',
                }}
              >
                {event.name.charAt(0)}
              </div>
            )}
            {theme.headerShowTitle !== false && (
              <div>
                <span
                  className="font-bold block leading-tight line-clamp-1"
                  style={{
                    color: theme.headerTitleColor || theme.headerTextColor || undefined,
                    fontFamily: theme.headerTitleFontFamily ? getFontFamilyCss(theme.headerTitleFontFamily) : undefined,
                    fontSize: theme.headerTitleFontSize ? `${theme.headerTitleFontSize}px` : '15px',
                    fontWeight: theme.headerTitleFontWeight || 'bold',
                  }}
                >
                  {theme.headerTitleText || event.name}
                </span>
                <span className="text-xs opacity-75 hidden sm:inline" style={{ color: theme.headerTextColor || undefined }}>
                  by {org.name}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center font-medium"
            style={{
              gap: theme.headerNavSpacing !== undefined ? `${theme.headerNavSpacing}px` : '24px',
              fontFamily: theme.headerNavFontFamily ? getFontFamilyCss(theme.headerNavFontFamily) : undefined,
              fontSize: theme.headerNavFontSize ? `${theme.headerNavFontSize}px` : '14px',
            }}
          >
            {sortedSections.map((sec) => {
              if (!sec.isVisible) return null;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="hover:opacity-75 transition"
                  style={{ color: theme.headerTextColor || undefined }}
                >
                  {sec.title}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/p/${slug}/register`}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow transition hover:opacity-95"
              style={{
                backgroundColor: theme.headerCtaBg || theme.buttonBgColor || theme.primaryColor || '#2563eb',
                color: theme.headerCtaTextColor || theme.buttonTextColor || '#ffffff',
                borderRadius: theme.headerCtaBorderRadius || theme.buttonBorderRadius || '8px',
              }}
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{theme.headerCtaText || theme.ctaButtonText || 'Register Now'}</span>
            </Link>

            {/* Mobile Hamburger Navigation Drawer */}
            <PublicMobileNav
              sections={sortedSections}
              registerHref={`/p/${slug}/register`}
              ctaText={theme.headerCtaText || theme.ctaButtonText || 'Register Now'}
              headerTextColor={theme.headerTextColor}
              buttonBgColor={theme.headerCtaBg || theme.buttonBgColor || theme.primaryColor || '#2563eb'}
              buttonTextColor={theme.headerCtaTextColor || theme.buttonTextColor || '#ffffff'}
              buttonBorderRadius={theme.headerCtaBorderRadius || theme.buttonBorderRadius || '8px'}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`relative overflow-hidden border-b border-slate-200 dark:border-slate-800 ${
          theme.heroHideOverlay || (theme.heroOverlayOpacity === 0)
            ? 'bg-transparent text-white'
            : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white hero-dark-banner'
        }`}
        style={{
          backgroundColor: theme.heroBgColor ? theme.heroBgColor : undefined,
          color: theme.heroTextColor || '#ffffff',
          minHeight: theme.heroMinHeight ? `${theme.heroMinHeight}px` : undefined,
          paddingTop: theme.heroPaddingY ? `${theme.heroPaddingY}px` : '4rem',
          paddingBottom: theme.heroPaddingY ? `${theme.heroPaddingY}px` : '4rem',
        }}
      >
        {website?.heroCoverUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src={website.heroCoverUrl}
              alt={event.name}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-full h-full object-cover object-center"
            />
            {!theme.heroHideOverlay && (theme.heroOverlayOpacity ?? 25) > 0 && (
              <div
                className="absolute inset-0 transition-opacity"
                style={{
                  backgroundColor: theme.heroOverlayColor || theme.heroBgColor || '#000000',
                  opacity: (theme.heroOverlayOpacity ?? 25) / 100,
                }}
              />
            )}
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`max-w-3xl ${
              theme.heroAlignment === 'center'
                ? 'mx-auto text-center'
                : theme.heroAlignment === 'right'
                ? 'ml-auto text-right'
                : 'text-left'
            }`}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border"
              style={{
                backgroundColor: `${theme.primaryColor || '#2563eb'}20`,
                borderColor: `${theme.primaryColor || '#2563eb'}40`,
                color: theme.accentColor || '#38bdf8',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{theme.heroEyebrow || 'Official Registration Portal'}</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-sm"
              style={{
                fontFamily: theme.heroTitleFontFamily ? getFontFamilyCss(theme.heroTitleFontFamily) : undefined,
                fontWeight: theme.heroTitleFontWeight || undefined,
                color: theme.heroTitleColor || theme.heroTextColor || '#ffffff',
                fontSize: theme.heroTitleFontSize ? `${theme.heroTitleFontSize}px` : undefined,
              }}
            >
              {website?.heroTitle || event.name}
            </h1>

            <p
              className="mt-4 text-base sm:text-lg leading-relaxed max-w-2xl font-normal"
              style={{
                fontFamily: theme.heroSubtitleFontFamily ? getFontFamilyCss(theme.heroSubtitleFontFamily) : undefined,
                fontSize: theme.heroSubtitleFontSize ? `${theme.heroSubtitleFontSize}px` : undefined,
                color: theme.heroSubtitleColor || theme.heroSubtextColor || '#f1f5f9',
              }}
            >
              {website?.heroSubtitle ||
                `Join premier faculty, industry delegates, and practitioners at ${event.name}. Secure your verified entry pass today.`}
            </p>

            {/* Date & Venue Badges */}
            <div
              className={`mt-6 flex flex-wrap gap-4 text-sm text-white ${
                theme.heroAlignment === 'center'
                  ? 'justify-center'
                  : theme.heroAlignment === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {startDateFormatted && (
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-md backdrop-blur-md preserve-dark-badge"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white" style={{ color: '#ffffff' }}>
                    {startDateFormatted}
                    {endDateFormatted && endDateFormatted !== startDateFormatted ? ` — ${endDateFormatted}` : ''}
                  </span>
                </div>
              )}

              {event.venue && (
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-md backdrop-blur-md preserve-dark-badge"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-semibold text-white line-clamp-1" style={{ color: '#ffffff' }}>{event.venue}</span>
                </div>
              )}
            </div>

            {/* CTA Group */}
            <div
              className={`mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch ${
                theme.heroAlignment === 'center'
                  ? 'sm:justify-center'
                  : theme.heroAlignment === 'right'
                  ? 'sm:justify-end'
                  : 'sm:items-center'
              }`}
            >
              <Link
                href={`/p/${slug}/register`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition text-center"
                style={{
                  backgroundColor: theme.ctaButtonBg || theme.buttonBgColor || theme.primaryColor || '#2563eb',
                  color: theme.ctaButtonTextColor || theme.buttonTextColor || '#ffffff',
                  borderRadius: theme.ctaButtonBorderRadius || theme.buttonBorderRadius || '8px',
                }}
              >
                <Ticket className="w-5 h-5" />
                <span>{theme.ctaButtonText || 'Select Passes & Register'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              {theme.secondaryButtonText && (
                <a
                  href={theme.secondaryButtonLink || '#agenda'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm sm:text-base font-medium shadow-sm transition text-center border"
                  style={{
                    backgroundColor: theme.secondaryButtonBg || 'rgba(255, 255, 255, 0.1)',
                    color: theme.secondaryButtonTextColor || '#f1f5f9',
                    borderColor: theme.secondaryButtonBorderColor || 'rgba(255, 255, 255, 0.2)',
                    borderRadius: theme.secondaryButtonBorderRadius || theme.buttonBorderRadius || '8px',
                  }}
                >
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span>{theme.secondaryButtonText}</span>
                </a>
              )}
              {!theme.secondaryButtonText && isSectionVisible('agenda') && sessions.length > 0 && (
                <a
                  href="#agenda"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition text-center"
                >
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>View Schedule</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections rendering in user-configured displayOrder */}
      {sortedSections.map((sec) => {
        if (!sec.isVisible) return null;

        if (sec.id === 'about') {
          return (
            <section
              key={sec.id}
              id="about"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'About the Event'}
                  </h2>
                  {sec.subtitle && (
                    <p className="mt-1 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <div className="mt-4 prose dark:prose-invert leading-relaxed text-sm sm:text-base whitespace-pre-line" style={{ color: sec.textColor || undefined }}>
                    {website?.aboutText || 'Welcome to this premier conference event.'}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (sec.id === 'countdown') {
          return (
            <section
              key={sec.id}
              id="countdown"
              className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white"
              style={{
                backgroundColor: sec.bgColor || undefined,
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '3rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '3rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-300 mb-3 border border-white/10">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Event Countdown</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">Opening Keynote Countdown</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
                  {startDateFormatted ? `Scheduled to commence on ${startDateFormatted}` : 'Registration is officially open.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
                  <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[80px]">
                    <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                      {event.startDate ? Math.max(0, Math.ceil((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : '07'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Days</span>
                  </div>
                  <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[80px]">
                    <span className="block text-2xl sm:text-3xl font-black font-mono text-white">08</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hours</span>
                  </div>
                  <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[80px]">
                    <span className="block text-2xl sm:text-3xl font-black font-mono text-white">30</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mins</span>
                  </div>
                  <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[80px]">
                    <span className="block text-2xl sm:text-3xl font-black font-mono text-white">00</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Secs</span>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (sec.id === 'tickets') {
          return (
            <section
              key={sec.id}
              id="tickets"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#020617' : '#f8fafc'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Admission Passes & Tickets'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Transparent pricing with early-bird discounts and instant digital ticket delivery.'}
                  </p>
                </div>

                {tickets.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Ticket className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Passes for this event will be announced soon.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((t) => {
                      const isSoldOut = t.remainingQuantity <= 0 || t.status === 'sold_out';
                      const isFree = t.currentPrice === 0 || t.ticketType === 'free';

                      return (
                        <div
                          key={t.id}
                          className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                          style={{
                            backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                            borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                            borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {t.category}
                              </span>
                              {t.ruleDiscount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  Save ₹{t.ruleDiscount.toFixed(0)}
                                </span>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                              {t.name}
                            </h3>

                            {t.description && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                                {t.description}
                              </p>
                            )}

                            <div className="mt-6 flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                {isFree ? 'Free' : `₹${t.currentPrice.toFixed(0)}`}
                              </span>
                              {!isFree && t.basePrice > t.currentPrice && (
                                <span className="text-sm line-through text-slate-400">
                                  ₹{t.basePrice.toFixed(0)}
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-medium">/ person</span>
                            </div>

                            <p className="mt-2 text-xs text-slate-400">
                              {isSoldOut ? (
                                <span className="text-red-500 font-semibold">Sold Out</span>
                              ) : (
                                <span>{t.remainingQuantity} passes remaining</span>
                              )}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link
                              href={isSoldOut ? '#' : `/p/${slug}/register?ticketId=${t.id}`}
                              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition ${
                                isSoldOut
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'text-white shadow hover:opacity-95'
                              }`}
                              style={
                                !isSoldOut
                                  ? { backgroundColor: theme.primaryColor || '#2563eb' }
                                  : undefined
                              }
                            >
                              {isSoldOut ? 'Sold Out' : 'Select Pass'}
                              {!isSoldOut && <ChevronRight className="w-4 h-4" />}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (sec.id === 'speakers') {
          return (
            <section
              key={sec.id}
              id="speakers"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
                    <Users className="w-3.5 h-3.5" />
                    <span>Distinguished Faculty</span>
                  </div>
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Featured Faculty & Speakers'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Learn from world-class industry leaders, clinicians, and researchers.'}
                  </p>
                </div>

                {speakerRows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {speakerRows.map((sp) => (
                      <div
                        key={sp.id}
                        className="border rounded-xl p-5 text-center shadow-xs"
                        style={{
                          backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#f8fafc'),
                          borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                          borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                        }}
                      >
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          {sp.photoUrl ? (
                            <img src={sp.photoUrl} alt={sp.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{sp.name}</h4>
                        {sp.title && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{sp.title}</p>}
                        {sp.company && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sp.company}</p>}
                        {sp.bio && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{sp.bio}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-2">
                    <Users className="w-8 h-8 mx-auto text-purple-600/70" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Keynote Faculty & Speakers</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Distinguished keynote speakers, plenary panelists, and workshop instructors will be announced soon.
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (sec.id === 'agenda') {
          return (
            <section
              key={sec.id}
              id="agenda"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#020617' : '#f8fafc'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Conference Program</span>
                  </div>
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Program Schedule & Agenda'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Explore multi-track proceedings, technical sessions, and masterclasses.'}
                  </p>
                </div>

                {sessions.length > 0 ? (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {sessions.map((sess) => {
                      const startTimeStr = new Date(sess.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTimeStr = new Date(sess.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const track = tracks.find((tr) => tr.id === sess.trackId);

                      return (
                        <div
                          key={sess.id}
                          className="border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                          style={{
                            backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                            borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                            borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {startTimeStr} - {endTimeStr}
                              </span>
                              {track && (
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                                  style={{ backgroundColor: track.color || '#3b82f6' }}
                                >
                                  {track.name}
                                </span>
                              )}
                              {sess.room && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {sess.room}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {sess.title}
                            </h4>

                            {sess.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {sess.description}
                              </p>
                            )}

                            {sess.speakers.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <span className="text-xs text-slate-400">Speakers:</span>
                                {sess.speakers.map((sp, idx) => (
                                  <span key={idx} className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {sp.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-emerald-600/70" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Finalizing</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Multi-track keynotes, technical tracks, and breakout room allocations are currently being finalized.
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (sec.id === 'sponsors') {
          return (
            <section
              key={sec.id}
              id="sponsors"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-3">
                    <Award className="w-3.5 h-3.5" />
                    <span>Corporate Benefactors</span>
                  </div>
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Partners & Corporate Sponsors'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Proudly supported by leading organizations and innovators.'}
                  </p>
                </div>

                {sponsors.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-8 max-w-4xl mx-auto">
                    {sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="p-4 rounded-xl border text-center min-w-[160px]"
                        style={{
                          backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#f8fafc'),
                          borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                          borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                        }}
                      >
                        <span className="block text-xs uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {sp.tier} Partner
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {sp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-2">
                    <Award className="w-8 h-8 mx-auto text-amber-500/70" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Partnership Opportunities Open</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      For corporate partnerships, exhibition booths, or technology sponsorships, contact the organizing committee at{' '}
                      <span className="text-blue-600 font-semibold">{website?.contactEmail || 'admin@msbackstage.internal'}</span>.
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (sec.id === 'exhibitors') {
          return (
            <section
              key={sec.id}
              id="exhibitors"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#020617' : '#f8fafc'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Floor Plan & Directory</span>
                  </div>
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Exhibitor Directory'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Visit commercial stalls, technology demos, and scientific displays.'}
                  </p>
                </div>

                {exhibitors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {exhibitors.map((ex) => (
                      <div
                        key={ex.id}
                        className="border rounded-xl p-4 shadow-sm"
                        style={{
                          backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                          borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                          borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ex.name}</h4>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Stall: {ex.boothNumber}
                          </span>
                        </div>
                        {ex.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                            {ex.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-2">
                    <LayoutGrid className="w-8 h-8 mx-auto text-indigo-600/70" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Exhibition Space Allocation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Interactive booth numbers and floor maps will be published prior to event commencement.
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (sec.id === 'faq') {
          return (
            <section
              key={sec.id}
              id="faq"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Attendee Guidance</span>
                  </div>
                  <h2 className="text-3xl font-extrabold" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Frequently Asked Questions'}
                  </h2>
                  <p className="mt-3 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                    {sec.subtitle || 'Everything you need to know about passes, venue accreditation, and check-in procedures.'}
                  </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                  <div
                    className="border rounded-2xl p-5 shadow-xs"
                    style={{
                      backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#ffffff'),
                      borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                      borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                    }}
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">How will I receive my admission pass and badge?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Upon registration confirmation, your unique QR pass token will be instantly dispatched to your registered email address and accessible directly in your Attendee Portal. You may present this QR code at the onsite kiosk for rapid thermal badge printing.
                    </p>
                  </div>

                  <div
                    className="border rounded-2xl p-5 shadow-xs"
                    style={{
                      backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#ffffff'),
                      borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                      borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                    }}
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">What credentials are required at the check-in desk?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Please present your mobile confirmation QR payload or physical pass token along with a valid government or institutional photo ID. Rapid laser scanner stations ensure entry within 3 seconds.
                    </p>
                  </div>

                  <div
                    className="border rounded-2xl p-5 shadow-xs"
                    style={{
                      backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#ffffff'),
                      borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                      borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                    }}
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">How and when are attendance certificates issued?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Official tamper-proof digital certificates are issued cryptographically to all verified attendees who complete check-in requirements. Certificates can be previewed, validated online via public QR hash, or downloaded in high-res vector PDF.
                    </p>
                  </div>

                  <div
                    className="border rounded-2xl p-5 shadow-xs"
                    style={{
                      backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#0f172a' : '#ffffff'),
                      borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                      borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                    }}
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Can I transfer my pass to another participant?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Yes, pass reassignment can be performed up to 24 hours prior to the event start via the Attendee Portal or by contacting the event administration help desk.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (sec.id === 'contact') {
          return (
            <section
              key={sec.id}
              id="contact"
              className="border-b border-slate-200 dark:border-slate-800"
              style={{
                backgroundColor: sec.bgColor || (theme.darkMode ? '#020617' : '#f8fafc'),
                color: sec.textColor || undefined,
                paddingTop: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
                paddingBottom: sec.paddingY !== undefined ? `${sec.paddingY}px` : '4rem',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className="max-w-3xl mx-auto border rounded-2xl p-8"
                  style={{
                    backgroundColor: sec.cardBg || theme.cardBgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
                    borderColor: sec.cardBorder || theme.cardBorderColor || (theme.darkMode ? '#1e293b' : '#e2e8f0'),
                    borderRadius: sec.cardRadius !== undefined ? `${sec.cardRadius}px` : undefined,
                  }}
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: sec.textColor || undefined }}>
                    {sec.title || 'Venue & Contact Information'}
                  </h2>
                  {sec.subtitle && (
                    <p className="mb-4 text-sm opacity-80" style={{ color: sec.textColor || undefined }}>
                      {sec.subtitle}
                    </p>
                  )}

                  <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                    {event.venue && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-slate-900 dark:text-white">Event Venue</span>
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    )}

                    {website?.contactEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="font-semibold block text-slate-900 dark:text-white">Organizer Email</span>
                          <a href={`mailto:${website.contactEmail}`} className="text-blue-600 hover:underline">
                            {website.contactEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {website?.contactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="font-semibold block text-slate-900 dark:text-white">Help Desk</span>
                          <a href={`tel:${website.contactPhone}`} className="hover:underline">
                            {website.contactPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // Render Custom User-Defined Section or Structured Section Layout
        const secAny = sec as {
          id: string;
          title: string;
          isVisible: boolean;
          type?: string;
          layout?: string;
          bgColor?: string;
          bgGradient?: string;
          bgImageUrl?: string;
          bgOverlayOpacity?: number;
          textColor?: string;
          elements?: Array<{
            id: string;
            type: string;
            content?: string;
            fontFamily?: string;
            fontSize?: number;
            fontWeight?: string;
            color?: string;
            textAlign?: string;
            lineHeight?: number;
            buttonText?: string;
            buttonLink?: string;
            buttonBg?: string;
            buttonTextColor?: string;
            buttonRadius?: number;
            imageUrl?: string;
            altText?: string;
            imageRadius?: number;
            imageBorder?: string;
            cardBg?: string;
            cardBorder?: string;
            cardRadius?: number;
            cardPadding?: number;
          }>;
        };

        const customElements = secAny.elements || [];
        const secBgColor = secAny.bgColor;
        const secBgGradient = secAny.bgGradient;
        const secBgImageUrl = secAny.bgImageUrl;
        const secBgOverlay = secAny.bgOverlayOpacity;
        const secLayout = secAny.layout || 'stack';

        return (
          <section
            key={sec.id}
            id={sec.id}
            className="scroll-mt-20 py-16 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden"
            style={{
              backgroundColor: secBgColor || (theme.darkMode ? '#090d16' : '#ffffff'),
              backgroundImage: secBgGradient || undefined,
              color: secAny.textColor || theme.siteTextColor || undefined,
            }}
          >
            {secBgImageUrl && (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img src={secBgImageUrl} alt={sec.title} className="w-full h-full object-cover" />
                {secBgOverlay && secBgOverlay > 0 && (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: '#000000', opacity: secBgOverlay / 100 }}
                  />
                )}
              </div>
            )}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {sec.title}
                </h2>
              </div>

              {customElements.length > 0 ? (
                <div
                  className={`gap-6 ${
                    secLayout === 'columns-2'
                      ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                      : secLayout === 'columns-3'
                      ? 'grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto'
                      : secLayout === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto'
                      : 'space-y-6 max-w-3xl mx-auto flex flex-col items-center text-center'
                  }`}
                >
                  {customElements.map((el) => {
                    if (el.type === 'text') {
                      return (
                        <div
                          key={el.id}
                          className="w-full"
                          style={{
                            fontFamily: el.fontFamily ? fontFamilies[el.fontFamily] || el.fontFamily : undefined,
                            fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                            fontWeight:
                              el.fontWeight === 'extrabold'
                                ? 800
                                : el.fontWeight === 'bold'
                                ? 700
                                : el.fontWeight === 'semibold'
                                ? 600
                                : el.fontWeight === 'medium'
                                ? 500
                                : 400,
                            color: el.color || undefined,
                            textAlign: (el.textAlign as 'left' | 'center' | 'right') || 'inherit',
                            lineHeight: el.lineHeight || 1.5,
                          }}
                        >
                          {el.content}
                        </div>
                      );
                    }
                    if (el.type === 'button') {
                      return (
                        <div key={el.id} className="pt-2">
                          <a
                            href={el.buttonLink || '#tickets'}
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-95"
                            style={{
                              backgroundColor: el.buttonBg || theme.buttonBgColor || theme.primaryColor || '#2563eb',
                              color: el.buttonTextColor || theme.buttonTextColor || '#ffffff',
                              borderRadius: el.buttonRadius ? `${el.buttonRadius}px` : theme.buttonBorderRadius || '8px',
                            }}
                          >
                            <span>{el.buttonText || 'Learn More'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    }
                    if (el.type === 'image') {
                      return (
                        <div key={el.id} className="w-full overflow-hidden rounded-xl">
                          <img
                            src={el.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
                            alt={el.altText || sec.title}
                            className="w-full h-auto max-h-96 object-cover rounded-xl"
                            style={{
                              borderRadius: el.imageRadius ? `${el.imageRadius}px` : undefined,
                              border: el.imageBorder || undefined,
                            }}
                          />
                        </div>
                      );
                    }
                    if (el.type === 'card') {
                      return (
                        <div
                          key={el.id}
                          className="p-6 rounded-2xl border transition shadow-sm text-left"
                          style={{
                            backgroundColor: el.cardBg || theme.cardBgColor || '#ffffff',
                            borderColor: el.cardBorder || theme.cardBorderColor || '#e2e8f0',
                            borderRadius: el.cardRadius
                              ? `${el.cardRadius}px`
                              : theme.cardBorderRadius
                              ? `${theme.cardBorderRadius}px`
                              : '16px',
                            padding: el.cardPadding ? `${el.cardPadding}px` : undefined,
                          }}
                        >
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            {el.content || 'Feature Detail'}
                          </h3>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto">
                  <p className="text-xs text-slate-500">Custom section content configured by event organizers.</p>
                </div>
              )}
            </div>
          </section>
        );
      })}
      {/* Footer */}
      <footer
        className="mt-auto py-8 text-xs border-t"
        style={{
          backgroundColor: theme.footerBgColor || '#0f172a',
          color: theme.footerTextColor || '#94a3b8',
          borderTopColor: theme.footerBorderTopColor || (theme.darkMode ? '#1e293b' : '#334155'),
          fontSize: theme.footerFontSize ? `${theme.footerFontSize}px` : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p>{website?.footerText || `© ${new Date().getFullYear()} ${event.name}. All rights reserved.`}</p>
            <p className="mt-1 text-slate-500">
              Powered by MS Backstage • Event Operating System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Verified Event
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
