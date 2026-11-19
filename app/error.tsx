'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [referenceId] = useState(() => `ref_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`);

  useEffect(() => {
    // Log error on client console securely without disclosing backend secrets
    console.error(`[APPLICATION_ERROR][${referenceId}]:`, error.message);
  }, [error, referenceId]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-xl p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            An unexpected error occurred while loading this view. Your entered information has not been compromised.
          </p>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono break-all border border-slate-200 dark:border-slate-700/60">
          Incident Reference: {referenceId}
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-xs"
          >
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
