'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) {
  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const finalConfirmText = confirmText || confirmLabel || 'Confirm';
  const finalCancelText = cancelText || cancelLabel || 'Cancel';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const isDestructive = variant === 'destructive';
  const isWarning = variant === 'warning';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isDestructive
                  ? 'bg-red-50 text-red-600'
                  : isWarning
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {isDestructive ? (
                <AlertCircle className="w-6 h-6" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-base font-bold text-slate-900 leading-snug"
              >
                {title}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-2xs disabled:opacity-50"
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
