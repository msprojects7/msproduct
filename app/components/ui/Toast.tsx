'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  dismissible: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type: ToastType, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: { message?: string; type?: ToastType; duration?: number }) => void;
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    dismiss: (id: string) => void;
    update: (id: string, updates: { message?: string; type?: ToastType; duration?: number }) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 8000,
  loading: 0, // 0 = indefinite until updated or dismissed
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    // Clear timer
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions): string => {
      // Deduplication: prevent identical message of same type within 2,000ms
      const dedupeKey = `${type}:${message}`;
      const lastFired = recentMessagesRef.current.get(dedupeKey);
      const now = Date.now();
      if (lastFired && now - lastFired < 2000) {
        return '';
      }
      recentMessagesRef.current.set(dedupeKey, now);

      const id = `toast_${now}_${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration !== undefined ? options.duration : DEFAULT_DURATIONS[type];
      const dismissible = options?.dismissible !== false;

      const newToast: ToastItem = {
        id,
        type,
        message,
        duration,
        dismissible,
        action: options?.action,
        createdAt: now,
      };

      setToasts((prev) => {
        // Limit queue size to max 5 items
        const next = [...prev, newToast];
        if (next.length > 5) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) clearTimeout(timer);
          }
        }
        return next;
      });

      // Schedule auto-dismiss if duration > 0
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const updateToast = useCallback(
    (id: string, updates: { message?: string; type?: ToastType; duration?: number }) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const nextType = updates.type || t.type;
          const nextDuration =
            updates.duration !== undefined ? updates.duration : DEFAULT_DURATIONS[nextType];

          // Reset timer
          const existingTimer = timersRef.current.get(id);
          if (existingTimer) {
            clearTimeout(existingTimer);
            timersRef.current.delete(id);
          }

          if (nextDuration > 0) {
            const timer = setTimeout(() => {
              dismissToast(id);
            }, nextDuration);
            timersRef.current.set(id, timer);
          }

          return {
            ...t,
            ...(updates.message ? { message: updates.message } : {}),
            type: nextType,
            duration: nextDuration,
          };
        })
      );
    },
    [dismissToast]
  );

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  const toastHelpers = {
    success: (msg: string, opts?: ToastOptions) => showToast(msg, 'success', opts),
    error: (msg: string, opts?: ToastOptions) => showToast(msg, 'error', opts),
    warning: (msg: string, opts?: ToastOptions) => showToast(msg, 'warning', opts),
    info: (msg: string, opts?: ToastOptions) => showToast(msg, 'info', opts),
    loading: (msg: string, opts?: ToastOptions) => showToast(msg, 'loading', opts),
    dismiss: dismissToast,
    update: updateToast,
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        updateToast,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return context;
}

// -----------------------------------------------------------------------------
// Toast UI Container & Item Components
// -----------------------------------------------------------------------------

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 left-5 z-[9999] flex flex-col-reverse items-start gap-2 pointer-events-none w-auto max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </aside>
  );
}

const TYPE_CONFIG: Record<
  ToastType,
  {
    iconBg: string;
    iconColor: string;
    badgeRing: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    badgeRing: 'ring-emerald-500/30',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    iconBg: 'bg-rose-500/20 text-rose-400',
    iconColor: 'text-rose-500 dark:text-rose-400',
    badgeRing: 'ring-rose-500/30',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    iconBg: 'bg-amber-500/20 text-amber-400',
    iconColor: 'text-amber-500 dark:text-amber-400',
    badgeRing: 'ring-amber-500/30',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    iconBg: 'bg-blue-500/20 text-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    badgeRing: 'ring-blue-500/30',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  loading: {
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    badgeRing: 'ring-indigo-500/30',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const config = TYPE_CONFIG[toast.type];
  const role = toast.type === 'error' ? 'alert' : 'status';
  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-full sm:rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 border border-white/15 dark:border-white/10 text-white shadow-2xl backdrop-blur-xl text-xs font-medium max-w-full transition-all duration-200 transform animate-in fade-in slide-in-from-top-3"
      style={{
        boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.1) inset',
      }}
    >
      {/* Icon badge */}
      <div className={`p-1 rounded-full ${config.iconBg} ring-1 ${config.badgeRing} shrink-0 flex items-center justify-center`}>
        {config.icon}
      </div>

      {/* Message & Action */}
      <div className="flex items-center gap-2 min-w-0 pr-1">
        <span className="truncate text-slate-100 font-medium text-[11.5px] sm:text-xs">
          {toast.message}
        </span>
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="shrink-0 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition ml-0.5"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
