'use client';

import React from 'react';

/**
 * 1. Full-Page / Container Branded Loading Screen
 */
export function BrandedLoadingScreen({
  message = 'Loading MS Backstage...',
  fullScreen = true,
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 transition-colors duration-200 ${
        fullScreen
          ? 'min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
          : 'min-h-[300px] bg-transparent text-slate-900 dark:text-white'
      }`}
    >
      {/* MS Backstage Logo Mark */}
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-2xl tracking-tighter shadow-xl mb-4">
        <img
          src="/msfav.png"
          alt="MS Backstage Logo"
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* Subtle spinning indicator */}
      <div className="w-7 h-7 border-3 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-3" />

      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 text-center">
        {message}
      </span>
    </div>
  );
}

/**
 * 2. Table Skeleton Loader for Attendee List & Reports
 */
export function TableSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      role="status"
      aria-label="Loading table data"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          height: '44px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          gap: '1rem',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '14px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* Skeleton rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            height: '52px',
            borderBottom: r === rows - 1 ? 'none' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            gap: '1rem',
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              style={{
                flex: 1,
                height: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${c * 0.1}s`,
              }}
            />
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/**
 * 3. Card Skeleton Loader for Dashboards
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading metric cards"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        width: '100%',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '12px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: '60%',
              height: '24px',
              backgroundColor: '#cbd5e1',
              borderRadius: '6px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/**
 * 4. Inline Button Spinner
 */
export function ButtonSpinner({ size = 16, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        verticalAlign: 'middle',
      }}
    >
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}
