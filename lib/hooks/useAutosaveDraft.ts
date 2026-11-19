'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface UseAutosaveDraftOptions<T> {
  organizationId: string;
  draftType: string;
  eventId?: string;
  initialData: T;
  debounceMs?: number;
  onRestored?: (restoredData: T) => void;
}

export function useAutosaveDraft<T extends Record<string, any>>({
  organizationId,
  draftType,
  eventId,
  initialData,
  debounceMs = 1500,
  onRestored,
}: UseAutosaveDraftOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const localKey = `ms_draft_${organizationId}_${draftType}_${eventId || 'root'}`;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // 1. Initial Load: Check server draft, fallback to localStorage
  useEffect(() => {
    let isSubscribed = true;

    async function loadExistingDraft() {
      if (!organizationId) return;

      try {
        const queryParams = new URLSearchParams({
          organizationId,
          draftType,
          ...(eventId ? { eventId } : {}),
        });

        const res = await fetch(`/api/drafts?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.draft && isSubscribed) {
            setDraftId(json.draft.id);
            setData(json.draft.data);
            setLastSaved(new Date(json.draft.updatedAt));
            setStatus('saved');
            onRestored?.(json.draft.data);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch server draft, checking local backup:', err);
      }

      // Fallback: check localStorage
      try {
        const localBackup = localStorage.getItem(localKey);
        if (localBackup && isSubscribed) {
          const parsed = JSON.parse(localBackup);
          setData(parsed);
          setStatus('idle');
          onRestored?.(parsed);
        }
      } catch (err) {
        console.warn('Failed to parse local draft:', err);
      }
    }

    loadExistingDraft();

    return () => {
      isSubscribed = false;
    };
  }, [organizationId, draftType, eventId, localKey]);

  // 2. Perform Save to Server + LocalStorage
  const saveToServer = useCallback(
    async (payload: T) => {
      if (!organizationId) return;

      if (!navigator.onLine) {
        setStatus('offline');
        try {
          localStorage.setItem(localKey, JSON.stringify(payload));
        } catch {}
        return;
      }

      setStatus('saving');

      try {
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            draftType,
            eventId: eventId || null,
            data: payload,
          }),
        });

        if (!res.ok) {
          throw new Error('Save failed');
        }

        const resData = await res.json();
        setDraftId(resData.draft.id);
        setLastSaved(new Date(resData.lastSavedAt));
        setStatus('saved');
        setIsDirty(false);

        // Keep local backup updated
        try {
          localStorage.setItem(localKey, JSON.stringify(payload));
        } catch {}
      } catch (err) {
        console.error('Draft autosave error:', err);
        setStatus('error');
        // Still save locally so edits are never lost
        try {
          localStorage.setItem(localKey, JSON.stringify(payload));
        } catch {}
      }
    },
    [organizationId, draftType, eventId, localKey]
  );

  // 3. Trigger debounced autosave on data change
  const updateData = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        setIsDirty(true);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          saveToServer(next);
        }, debounceMs);

        return next;
      });
    },
    [debounceMs, saveToServer]
  );

  // 4. Manual immediate save
  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    return saveToServer(data);
  }, [data, saveToServer]);

  // 5. Discard draft
  const discardDraft = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    try {
      localStorage.removeItem(localKey);
    } catch {}

    if (draftId) {
      try {
        await fetch(`/api/drafts/${draftId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete draft on server:', err);
      }
    }

    setData(initialData);
    setDraftId(null);
    setIsDirty(false);
    setStatus('idle');
    setLastSaved(null);
  }, [draftId, initialData, localKey]);

  // 6. Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      if (isDirty) {
        saveNow();
      } else {
        setStatus('saved');
      }
    };
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDirty, saveNow]);

  // 7. Warn on window unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    data,
    updateData,
    saveNow,
    discardDraft,
    status,
    lastSaved,
    isDirty,
  };
}
