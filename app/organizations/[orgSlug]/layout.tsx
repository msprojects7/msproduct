import React from 'react';
import { requireOrgContext } from '@/lib/auth/context';
import { notFound, redirect } from 'next/navigation';
import AppleDock from '@/app/components/navigation/AppleDock';

export const dynamic = 'force-dynamic';

export default async function OrganizationWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  let context;
  try {
    context = await requireOrgContext(params.orgSlug);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error?.statusCode === 401) redirect('/auth/sign-in');
    if (error?.statusCode === 404) notFound();
    if (error?.statusCode === 403) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-900/60 shadow-xl p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m14.5 9-5 5" />
                <path d="m9.5 9 5 5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {error.message || 'You do not have active membership privileges for this organization workspace.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <a href="/organizations" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-xs">
                View My Organizations
              </a>
              <a href="/dashboard" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition border border-slate-200 dark:border-slate-700">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    throw err;
  }

  const { organization, effectiveRole, user } = context;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 selection:bg-blue-500/30 transition-colors duration-200">
      {/* Persistent Top Floating macOS Organization Navigation Dock */}
      <AppleDock
        variant="org"
        orgSlug={organization.slug}
        orgName={organization.name}
        userRole={effectiveRole}
        userName={user.name || user.email}
      />

      {/* Sibling Page Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
