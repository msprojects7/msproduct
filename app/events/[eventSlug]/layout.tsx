import React from 'react';
import { requireEventContext } from '@/lib/auth/context';
import { notFound, redirect } from 'next/navigation';
import AppleDock from '@/app/components/navigation/AppleDock';

export const dynamic = 'force-dynamic';

export default async function EventWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const { event, organization, effectiveRole, user } = context;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 selection:bg-blue-500/30 transition-colors duration-200">
      {/* Persistent Top Floating macOS Event Navigation Dock */}
      <AppleDock
        variant="event"
        eventSlug={event.slug}
        eventName={event.name}
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
