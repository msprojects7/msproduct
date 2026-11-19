'use client';

import React, { useState, useEffect } from 'react';
import { updateAnalyticsConsent, GA_MEASUREMENT_ID } from '@/lib/analytics';
import { ShieldCheck, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only display if GA is configured and user hasn't made a decision
    if (GA_MEASUREMENT_ID) {
      try {
        const consent = localStorage.getItem('ms_cookie_consent');
        if (!consent) {
          setVisible(true);
        }
      } catch {
        // localStorage unavailable (e.g. strict sandbox)
      }
    }
  }, []);

  if (!mounted || !visible) return null;

  const handleAccept = () => {
    updateAnalyticsConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    updateAnalyticsConsent(false);
    setVisible(false);
  };

  return (
    <aside
      role="region"
      aria-label="Privacy and Cookie Preferences"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        maxWidth: '560px',
        margin: '0 auto',
        backgroundColor: '#111827',
        color: '#f9fafb',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        zIndex: 9999,
        border: '1px solid #374151',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <ShieldCheck style={{ width: '22px', height: '22px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.375rem 0', color: '#fff' }}>
            Privacy & Cookie Preferences
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
            MS Backstage uses anonymous, privacy-safe analytics on public marketing pages to improve our platform.
            We <strong>never</strong> track personal attendee records, phone numbers, emails, QR tokens, or private event operations.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
            <button
              onClick={handleAccept}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Accept Analytics
            </button>
            <button
              onClick={handleDecline}
              style={{
                backgroundColor: '#374151',
                color: '#d1d5db',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie consent banner"
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </aside>
  );
}
