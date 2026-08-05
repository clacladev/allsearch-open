'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCollectionRunProgress } from './useCollectionRunProgress';

type CollectionRunContextValue = ReturnType<typeof useCollectionRunProgress>;

const CollectionRunContext = createContext<CollectionRunContextValue | undefined>(undefined);

// Exists so the progress bar and the cadence surfaces share one EventSource and one `/active`
// discovery poll, rather than two `useCollectionRunProgress` instances racing on the same Run.
export function CollectionRunProvider({ children }: { children: ReactNode }) {
  const value = useCollectionRunProgress();
  return <CollectionRunContext.Provider value={value}>{children}</CollectionRunContext.Provider>;
}

export function useCollectionRunContext(): CollectionRunContextValue {
  const context = useContext(CollectionRunContext);
  if (!context) {
    throw new Error('useCollectionRunContext must be used within a CollectionRunProvider');
  }
  return context;
}
