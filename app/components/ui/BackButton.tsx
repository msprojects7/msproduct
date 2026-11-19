'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface BackButtonProps {
  href?: string;
  label?: string;
  fallbackHref?: string;
  className?: string;
  confirmUnsaved?: boolean;
  isDirty?: boolean;
}

export function BackButton({
  href,
  label = 'Back',
  fallbackHref = '/dashboard',
  className = '',
  confirmUnsaved = false,
  isDirty = false,
}: BackButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const navigateAway = () => {
    if (href) {
      router.push(href);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (confirmUnsaved && isDirty) {
      e.preventDefault();
      setShowConfirm(true);
      return;
    }

    if (!href) {
      e.preventDefault();
      navigateAway();
    }
  };

  const content = (
    <>
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 shrink-0" />
      <span className="font-medium text-xs sm:text-sm">{label}</span>
    </>
  );

  const baseClasses = `group inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-full shadow-xs hover:shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`;

  return (
    <>
      {href && !confirmUnsaved ? (
        <Link href={href} onClick={handleClick} className={baseClasses} aria-label={label}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={handleClick} className={baseClasses} aria-label={label}>
          {content}
        </button>
      )}

      {/* Branded confirmation dialog when user has unsaved edits */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          navigateAway();
        }}
        title="Discard Unsaved Changes?"
        description="You have unsaved changes in this form. Leaving this page will discard your recent edits."
        confirmText="Discard and Leave"
        variant="destructive"
      />
    </>
  );
}

export default BackButton;
