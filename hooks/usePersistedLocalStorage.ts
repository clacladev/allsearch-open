'use client';

import { useEffect, useRef } from 'react';

type PersistedLocalStorageValue<T> = {
  version: number;
  expiresAt: number;
  data: T;
};

function safeParsePersistedValue<T>(raw: string): PersistedLocalStorageValue<T> | undefined {
  try {
    const parsed = JSON.parse(raw) as PersistedLocalStorageValue<T>;
    if (!parsed || typeof parsed !== 'object') return undefined;
    if (typeof parsed.version !== 'number') return undefined;
    if (typeof parsed.expiresAt !== 'number') return undefined;
    if (!('data' in parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function usePersistedLocalStorage<T>({
  storageKey,
  version,
  ttlMs,
  state,
  setStateAction,
  resetStateAction,
  isEmptyAction,
}: {
  storageKey: string | undefined;
  version: number;
  ttlMs: number;
  state: T;
  setStateAction: (value: T) => void;
  resetStateAction: () => void;
  isEmptyAction: (value: T) => boolean;
}) {
  const storageKeyRef = useRef<string | undefined>(undefined);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    hydratedRef.current = false;
    storageKeyRef.current = storageKey;
    resetStateAction();

    if (!storageKey) return;

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      hydratedRef.current = true;
      return;
    }

    const parsed = safeParsePersistedValue<T>(raw);
    if (!parsed || parsed.version !== version || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey);
      hydratedRef.current = true;
      return;
    }

    setStateAction(parsed.data);
    hydratedRef.current = true;
  }, [resetStateAction, setStateAction, storageKey, version]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!storageKey) return;
    if (!hydratedRef.current) return;
    if (storageKeyRef.current !== storageKey) return;

    if (isEmptyAction(state)) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const persisted: PersistedLocalStorageValue<T> = {
      version,
      expiresAt: Date.now() + ttlMs,
      data: state,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(persisted));
  }, [isEmptyAction, state, storageKey, ttlMs, version]);
}
