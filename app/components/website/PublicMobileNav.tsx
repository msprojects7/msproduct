'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Ticket, ChevronRight } from 'lucide-react';

interface PublicMobileNavProps {
  sections: Array<{ id: string; title: string; isVisible: boolean }>;
  registerHref: string;
  ctaText?: string;
  headerTextColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: string;
}

export default function PublicMobileNav({
  sections,
  registerHref,
  ctaText = 'Register Now',
  headerTextColor,
  buttonBgColor = '#2563eb',
  buttonTextColor = '#ffffff',
  buttonBorderRadius = '8px',
}: PublicMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeSections = sections.filter((s) => s.isVisible);

  return (
    <div className="lg:hidden">
      {/* Mobile / Tablet Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        className="p-2 rounded-xl transition hover:opacity-80 flex items-center justify-center border border-slate-200/40 dark:border-slate-800"
        style={{ color: headerTextColor || undefined }}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Slide-out Mobile Sheet */}
      {isOpen && (
        <div
          className="fixed inset-x-0 top-[65px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Menu
            </span>

            {activeSections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 border-b border-slate-100 dark:border-slate-800/60"
              >
                <span>{sec.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}

            <div className="pt-3">
              <Link
                href={registerHref}
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 rounded-xl text-center font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                style={{
                  backgroundColor: buttonBgColor,
                  color: buttonTextColor,
                  borderRadius: buttonBorderRadius,
                }}
              >
                <Ticket className="w-4 h-4" />
                <span>{ctaText}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
