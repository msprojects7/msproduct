import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  action,
  className = '',
}: EmptyStateProps) {
  const finalActionLabel = action?.label || actionLabel;
  const finalActionHref = action?.href || actionHref;
  const finalOnAction = action?.onClick || onAction;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon as LucideIcon;
      return <IconComp className="w-7 h-7 sm:w-8 sm:h-8" />;
    }
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
        {renderIcon()}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {finalActionLabel && finalActionHref && (
        <Link
          href={finalActionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
        >
          {finalActionLabel}
        </Link>
      )}

      {finalActionLabel && !finalActionHref && finalOnAction && (
        <button
          type="button"
          onClick={finalOnAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
        >
          {finalActionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
