'use client';

import { usePersistedLocalStorage } from '@/hooks/usePersistedLocalStorage';
import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// --- Constants ---

const HIDE_MESSAGE_FOREVER = 0;
export const HIDE_MESSAGE_ONE_DAY_MS = 1000 * 60 * 60 * 24;

// --- Persistance ---

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = HIDE_MESSAGE_ONE_DAY_MS * 180; // 6 months

const DRAFT_STORAGE_KEY = 'messages';

export function clearStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

// --- Types ---

type MessagesPayload = {
  hiddenMessages: Record<string, number>; // messageId -> timestamp when dismissed
};

interface MessagesContextType {
  resetAll: () => void;
  hiddenMessages: Record<string, number>;
  hideMessage: (messageId: string, durationMs?: number) => void;
  getIsMessageHidden: (messageId: string) => boolean;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesContextProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hiddenMessages, setHiddenMessages] = useState<Record<string, number>>({});
  const draftState = useMemo<MessagesPayload>(() => ({ hiddenMessages }), [hiddenMessages]);

  const setDraftState = useCallback((draft: MessagesPayload) => {
    const isValidHiddenMessages =
      !!draft &&
      typeof draft === 'object' &&
      !!draft.hiddenMessages &&
      typeof draft.hiddenMessages === 'object';

    setHiddenMessages(isValidHiddenMessages ? draft.hiddenMessages : {});
    setIsInitialized(true);
  }, []);

  const hideMessage = useCallback((messageId: string, durationMs?: number) => {
    const expiresAt = durationMs ? Date.now() + durationMs : HIDE_MESSAGE_FOREVER;
    setHiddenMessages((prev) => ({ ...(prev ?? {}), [messageId]: expiresAt }));
  }, []);

  const getIsMessageHidden = useCallback(
    (messageId: string) => {
      const expiresAt = hiddenMessages?.[messageId];
      if (expiresAt === undefined) return false;
      if (expiresAt === HIDE_MESSAGE_FOREVER) return true;
      return expiresAt > Date.now();
    },
    [hiddenMessages]
  );

  const resetDraftState = useCallback(() => setDraftState({ hiddenMessages: {} }), []);

  usePersistedLocalStorage<MessagesPayload>({
    storageKey: DRAFT_STORAGE_KEY,
    version: DRAFT_VERSION,
    ttlMs: DRAFT_TTL_MS,
    state: draftState,
    setStateAction: setDraftState,
    resetStateAction: resetDraftState,
    isEmptyAction: (state) => Object.keys(state.hiddenMessages).length === 0,
  });

  return (
    <MessagesContext.Provider
      value={{
        resetAll: resetDraftState,
        hiddenMessages,
        hideMessage,
        getIsMessageHidden,
      }}
    >
      {isInitialized ? children : null}
    </MessagesContext.Provider>
  );
}

export function useMessagesContext() {
  const context = useContext(MessagesContext);
  if (context) return context;
  throw new Error('useMessagesContext must be used within a MessagesContextProvider');
}
