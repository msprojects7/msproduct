import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Accept Invitation',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function InvitationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
