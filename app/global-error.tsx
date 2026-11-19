'use client';

import React, { useEffect, useState } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [referenceId] = useState(() => `glob_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`);

  useEffect(() => {
    // Log fatal client error securely without exposing internals to the user
    console.error(`[CRITICAL_SYSTEM_ERROR][${referenceId}]:`, error.message);
  }, [error, referenceId]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '2.5rem 2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            System Notice
          </h1>

          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            An unexpected application error prevented the page from rendering. Please reload or contact support if the issue persists.
          </p>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              marginBottom: '1.5rem',
            }}
          >
            Reference: {referenceId}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
