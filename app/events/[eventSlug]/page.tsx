import React from 'react';
import { requireEventContext } from '@/lib/auth/context';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import BackButton from '@/app/components/ui/BackButton';
import {
  Users,
  QrCode,
  Printer,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EventOverviewPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  let context;
  try {
    context = await requireEventContext(params.eventSlug);
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error?.statusCode === 401) redirect('/auth/sign-in');
    if (error?.statusCode === 404) notFound();
    throw err;
  }

  const { event, organization, effectiveRole } = context;

  const canManageStaff = context.hasPermission('event:manage_staff');
  const canImportAttendees = context.hasPermission('event:import_attendees');

  return (
    <div className="pb-16">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/organizations/${organization.slug}`}
              label={`Back to ${organization.name}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20 capitalize shadow-xs">
              Role: {effectiveRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Event Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Operations Command</h2>
        </div>

        {/* Operational Desks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Desk 1: Spot Registration */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-3 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Spot Registration</h3>
            </div>
            <Link
              href={`/events/${event.slug}/spot-registration`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Spot Desk
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Desk 2: QR Scanner */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-3 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">QR Scanner Desk</h3>
            </div>
            <Link
              href={`/events/${event.slug}/scanner`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Scanner
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Desk 3: Badge Studio */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold mb-3 shadow-xs">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Badge Desk &amp; Designer</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/events/${event.slug}/badges`}
                className="flex-1 inline-flex items-center justify-center px-3.5 py-2.5 rounded-full text-xs font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                Print Desk →
              </Link>
              <Link
                href={`/events/${event.slug}/badges/designer`}
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                Designer
              </Link>
            </div>
          </div>

          {/* Desk 4: Reports & Analytics */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-3 shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reports &amp; Analytics</h3>
            </div>
            <Link
              href={`/events/${event.slug}/reports`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              View Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Secondary Operational Roster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href={`/events/${event.slug}/attendees`}
            className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
          >
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Attendee Directory</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Filter, search &amp; batch print badges</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
            </div>
          </Link>

          {canImportAttendees && (
            <Link
              href={`/events/${event.slug}/import`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Excel / CSV Import</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Bulk roster onboarding</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>
          )}

          {canManageStaff && (
            <Link
              href={`/events/${event.slug}/staff`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Event Staff Delegation</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Role assignments for desks &amp; scanners</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>
          )}
        </div>

        {/* Ticketing, Pricing & Registration Engine (Stage 2) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ticketing &amp; Registration Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Link
              href={`/events/${event.slug}/tickets`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Pricing
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ticket Classes</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Tiers, inventory &amp; early bird</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/registration-forms`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Builder
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Form Builder</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">17 field types &amp; live preview</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/registrations`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Orders
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Orders &amp; Sales</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Live attendee order desk</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
              </div>
            </Link>
          </div>
        </div>

        {/* Public Experience & Event Website (Stage 3) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Public Website &amp; Microsite Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href={`/events/${event.slug}/website`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Builder
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Website Builder</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Customize hero, theme, sections &amp; SEO</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>

            <a
              href={`/p/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Live Portal
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Public Microsite</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">View live landing page (/p/{event.slug})</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
              </div>
            </a>

            <Link
              href={`/p/${event.slug}/register`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Checkout
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Public Registration</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Multi-attendee &amp; Razorpay flow</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
              </div>
            </Link>
          </div>
        </div>

        {/* Onsite Operations, Badges, Analytics & Certificates (Stage 4) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Onsite Operations, Attendance &amp; Credentials
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Link
              href={`/events/${event.slug}/check-in`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Check-In Desk
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Check-In Operations</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">High-speed scan &amp; overrides</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/badge-printing`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Badges
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Badge Printing Ops</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Queue, reprint tracking &amp; batch</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/certificates`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Credentials
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Certificates Studio</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Automated issue &amp; verification</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
              </div>
            </Link>
          </div>
        </div>

        {/* Conference Content & Partnerships Engine */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conference Content &amp; Partnerships
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href={`/events/${event.slug}/speakers`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Faculty
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Speaker Directory</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Keynotes, faculty &amp; panel chairs</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/agenda`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Schedule
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Track Agenda</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Tracks, rooms &amp; conflict-free sessions</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>

            <Link
              href={`/events/${event.slug}/sponsors`}
              className="p-5 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Partners
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sponsors &amp; Exhibitors</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Partnership tiers &amp; commercial booths</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
