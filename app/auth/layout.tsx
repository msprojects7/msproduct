import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in to MS Backstage Event Management Platform',
  robots: {
    index: true,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
