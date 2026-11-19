import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Organizations',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
