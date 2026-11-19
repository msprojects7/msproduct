'use client';

import React, { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    async function performSignOut() {
      try {
        await authClient.signOut();
        setStatus('Signed out successfully. Redirecting...');
        router.push('/auth/sign-in?logged_out=true');
        router.refresh();
      } catch (err) {
        setStatus('Error signing out. Redirecting to login...');
        setTimeout(() => router.push('/auth/sign-in?logged_out=true'), 1500);
      }
    }
    performSignOut();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#4b5563' }}>{status}</p>
    </div>
  );
}
