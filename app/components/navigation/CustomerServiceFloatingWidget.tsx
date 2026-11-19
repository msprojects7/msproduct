'use client';

import React, { useEffect, useState } from 'react';
import { PhoneCall, X } from 'lucide-react';

export default function CustomerServiceFloatingWidget() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+919999999999';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isDismissed) return null;

  return (
    <>
      {/* Floating Customer Service Call Dialer FAB */}
      <aside
        aria-label="Customer Support Dialer"
        className="fixed bottom-5 right-5 z-40 print:hidden flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 transition-all hover:scale-[1.02]"
      >
        <a
          href={`tel:${supportPhone}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title={`Call Customer Support (${supportPhone})`}
          aria-label="Call Customer Support"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <PhoneCall className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="inline text-xs font-bold tracking-tight text-slate-900 dark:text-white !text-slate-900 dark:!text-white">Customer Support</span>
        </a>
        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="w-5 h-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="Dismiss support widget"
          aria-label="Dismiss support widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>

      {/* Persistent Clean Global Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm print:hidden">
        <p>© 2026, MS Backstage. All Rights Reserved.</p>
      </footer>
    </>
  );
}
