import React from 'react';
import { auth } from '@/lib/auth/server';
import { db } from '@/db/index';
import {
  organizations,
  organizationMembers,
  events,
  platformAdministrators,
} from '@/db/schema/index';
import { eq, or, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppleDock from '@/app/components/navigation/AppleDock';
import BackButton from '@/app/components/ui/BackButton';
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Users,
  Settings,
  CreditCard,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const { data: sessionData, error } = await auth.getSession();

  if (error || !sessionData?.user) {
    redirect('/auth/sign-in');
  }

  const user = sessionData.user;

  // Check if platform admin
  const [platformAdmin] = await db
    .select()
    .from(platformAdministrators)
    .where(
      user.email
        ? or(
            eq(platformAdministrators.userId, user.id),
            eq(platformAdministrators.email, user.email)
          )
        : eq(platformAdministrators.userId, user.id)
    )
    .limit(1);

  const isPlatformAdmin = Boolean(platformAdmin?.isActive);

  // Fetch organizations
  let orgList: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    logoUrl?: string | null;
    role?: string;
  }> = [];

  if (isPlatformAdmin) {
    const allOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        isActive: organizations.isActive,
        logoUrl: organizations.logoUrl,
      })
      .from(organizations);
    orgList = allOrgs.map((o) => ({ ...o, role: 'Platform Admin' }));
  } else {
    const userOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        isActive: organizations.isActive,
        logoUrl: organizations.logoUrl,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, user.id));
    orgList = userOrgs;
  }

  // Get event counts and member counts for each organization
  const enrichedOrgs = await Promise.all(
    orgList.map(async (org) => {
      const [evtCount] = await db
        .select({ value: count() })
        .from(events)
        .where(eq(events.organizationId, org.id));

      const [memberCount] = await db
        .select({ value: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, org.id));

      return {
        ...org,
        eventCount: evtCount?.value || 0,
        memberCount: memberCount?.value || 0,
      };
    })
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20 transition-colors duration-200">
      <AppleDock variant="dashboard" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 space-y-6">
        {/* Top Bar with BackButton and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                Organizations &amp; Workspaces
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Manage your enterprise workspaces, client accounts, and tenant configurations
              </p>
            </div>
          </div>

          <Link
            href="/organizations/new"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </Link>
        </div>

        {/* Organizations Grid */}
        {enrichedOrgs.length === 0 ? (
          <div className="p-10 glass-panel rounded-3xl text-center space-y-4 border border-slate-200 dark:border-slate-800">
            <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">No Organizations Found</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You haven&apos;t joined or created any organizations yet. Create an organization to start hosting conferences and configuring events.
            </p>
            <Link
              href="/organizations/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Organization</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrichedOrgs.map((org) => {
              const initials = org.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={org.id}
                  className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col justify-between space-y-5 group shadow-xs hover:shadow-md min-h-[230px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-700/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                          {initials || 'MS'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate" title={org.name}>
                            {org.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" title={`/${org.slug}`}>
                            /{org.slug}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                          org.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span>{org.eventCount} {org.eventCount === 1 ? 'Event' : 'Events'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                        <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span>{org.memberCount} Staff</span>
                      </div>
                    </div>

                    {org.role && (
                      <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                        Your Role:{' '}
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                          {org.role}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={`/organizations/${org.slug}`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href={`/organizations/${org.slug}/settings`}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 py-1 px-2 -mr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
