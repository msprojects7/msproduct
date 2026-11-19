import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
