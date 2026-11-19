import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Events',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
