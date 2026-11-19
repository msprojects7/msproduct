import React from 'react';
import { requireOrgContext } from '@/lib/auth/context';
import { db } from '@/db/index';
import { events } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import BackButton from '@/app/components/ui/BackButton';
import EmptyState from '@/app/components/ui/EmptyState';
import {
  Building2,
  Calendar,
  MapPin,
  Plus,
  Users,
  Settings,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizationWorkspacePage({
  params,
}: {
  params: { orgSlug: string };
}) {
  let context;
  try {
    context = await requireOrgContext(params.orgSlug);
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error?.statusCode === 401) redirect('/auth/sign-in');
    if (error?.statusCode === 404) notFound();
    if (error?.statusCode === 403) redirect('/organizations');
    throw err;
  }

  const { organization, effectiveRole, user } = context;

  // Fetch events under this organization
  const orgEvents = await db
    .select()
    .from(events)
    .where(eq(events.organizationId, organization.id));

  const canCreateEvent = context.hasPermission('org:create_event');
  const canManageMembers = context.hasPermission('org:manage_members');
  const canUpdateOrg = context.hasPermission('org:update');

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {organization.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 capitalize">
              Role: {effectiveRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Events &amp; Registrations</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Active conference desks, automated thermal badge layouts, and attendance operations
            </p>
          </div>
          {canCreateEvent && (
            <Link
              href={`/organizations/${organization.slug}/events/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          )}
        </div>

        {orgEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events created yet"
            description="Launch your first conference or summit in this workspace to configure spot registration desks, QR check-ins, and badge printing."
            action={
              canCreateEvent
                ? {
                    label: 'Create First Event',
                    href: `/organizations/${organization.slug}/events/new`,
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orgEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {evt.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        evt.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/50'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-3">
                    /{evt.slug}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {evt.venue && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    )}
                    {evt.startDate && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(evt.startDate).toLocaleDateString()}{' '}
                          {evt.endDate ? `– ${new Date(evt.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={`/events/${evt.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                    Open Event Console
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
