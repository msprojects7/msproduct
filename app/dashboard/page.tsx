import React from 'react';
import { auth } from '@/lib/auth/server';
import { db } from '@/db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  platformAdministrators,
} from '@/db/schema/index';
import { eq, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppleDock from '@/app/components/navigation/AppleDock';
import BackButton from '@/app/components/ui/BackButton';
import {
  Building2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Plus,
  Mail,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data: sessionData, error } = await auth.getSession();

  if (error || !sessionData?.user) {
    redirect('/auth/sign-in');
  }

  const user = sessionData.user;

  // 1. Resolve user's organizations
  const userOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      isActive: organizations.isActive,
      role: organizationMembers.role,
      membershipActive: organizationMembers.isActive,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, user.id));

  // 2. Resolve user's direct event staff assignments
  const userEvents = await db
    .select({
      id: events.id,
      organizationId: events.organizationId,
      name: events.name,
      slug: events.slug,
      status: events.status,
      role: eventStaffAssignments.role,
      assignmentActive: eventStaffAssignments.isActive,
    })
    .from(eventStaffAssignments)
    .innerJoin(events, eq(eventStaffAssignments.eventId, events.id))
    .where(eq(eventStaffAssignments.userId, user.id));

  // 3. Resolve platform administrator status
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      {/* Top Floating macOS Navigation Dock */}
      <AppleDock variant="dashboard" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        {/* Top-Left Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <BackButton href="/" label="Back to Home" />

          <div className="flex items-center gap-2">
            {isPlatformAdmin && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Platform Administrator
              </span>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">
              Signed in as <strong className="text-slate-200">{user.name || user.email}</strong>
            </span>
          </div>
        </div>

        {/* Platform Administrator Banner */}
        {isPlatformAdmin && (
          <div className="mb-8 p-5 sm:p-6 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm shadow-purple-500/5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  Platform Oversight Console Active
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700/50 font-bold">
                  ROOT PRIVILEGES
                </span>
              </div>
              <p className="text-xs text-purple-800/80 dark:text-purple-300/80 leading-relaxed max-w-2xl">
                You possess cross-tenant platform administration rights. You can inspect all organization workspaces, monitor audit trails, and manage tenant limits.
              </p>
            </div>
            <Link
              href="/organizations"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-full text-xs font-semibold transition shrink-0 shadow-md shadow-purple-600/20"
            >
              Browse All Organizations →
            </Link>
          </div>
        )}

        {/* Your Organizations Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                Your Organizations
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Workspaces and event tenants where you hold active membership
              </p>
            </div>
            <Link
              href="/organizations/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full text-xs font-semibold transition shadow-md shadow-blue-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </Link>
          </div>

          {userOrgs.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                No organization memberships found for your account.
              </p>
              <Link
                href="/organizations/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Create your first organization
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userOrgs.map((org) => (
                <div
                  key={org.id}
                  className="p-5 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-slate-700/80 rounded-2xl shadow-xs transition flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition tracking-tight">
                        {org.name}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          org.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      org/{org.slug}
                    </p>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                      Role:{' '}
                      <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">
                        {org.role}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <Link
                      href={`/organizations/${org.slug}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/organizations/${org.slug}/settings`}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Your Event Assignments Section */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              Direct Event Assignments
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Individual staff roles assigned to you for specific event operations
            </p>
          </div>

          {userEvents.length === 0 ? (
            <div className="p-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-center text-xs text-slate-600 dark:text-slate-400">
              No individual event assignments. (Organization owners and administrators manage all events across their tenant).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-5 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-slate-700/80 rounded-2xl shadow-xs transition flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition tracking-tight">
                        {evt.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                        {evt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      event/{evt.slug}
                    </p>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                      Assigned Role:{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                        {evt.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                    <Link
                      href={`/events/${evt.slug}`}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      Open Event Console <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invitation Quick Access Banner */}
        <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Have an invitation code?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Join an existing organization workspace or event team with your invitation token.
              </p>
            </div>
          </div>
          <Link
            href="/invitations/accept"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full text-xs font-semibold transition shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 shrink-0 inline-flex items-center gap-1.5"
          >
            Accept Invitation &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
