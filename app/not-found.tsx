import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            fontWeight: 800,
            fontSize: '1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em',
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            lineHeight: 1.5,
            margin: '0 0 2rem 0',
          }}
        >
          The page or resource you requested could not be found. It may have been moved, archived, or you may not have permission to view it.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
            }}
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
