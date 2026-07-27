import { useState, useEffect, useCallback } from 'react';

export default function useUrlHash(): string | undefined {
  const [currentHash, setCurrentHash] = useState<string | undefined>();

  const getHash = useCallback(() => {
    const hash = window.location.hash;
    return hash ? hash.replace('#', '') : undefined;
  }, []);

  const handleHashChange = useCallback(() => setCurrentHash(getHash()), [getHash]);

  useEffect(() => {
    setCurrentHash(getHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getHash, handleHashChange]);

  return currentHash;
}
