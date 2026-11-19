import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog: React.FC = () => {
  const { confirmModal, closeConfirm } = useApp();

  if (!confirmModal || !confirmModal.isOpen) return null;

  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (confirmModal.onCancel) confirmModal.onCancel();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal Surface */}
      <div 
        role="dialog" 
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl glass-popover p-6 shadow-2xl border border-slate-700/60 text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${confirmModal.isDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white tracking-tight">{confirmModal.title}</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{confirmModal.message}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors -mr-1 -mt-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            {confirmModal.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-lg active:scale-95 ${
              confirmModal.isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
            }`}
          >
            {confirmModal.confirmLabel || 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  );
};
