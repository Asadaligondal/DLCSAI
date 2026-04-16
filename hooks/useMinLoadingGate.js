'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Keeps a "loading" state until `dataReady` is true AND at least `minMs`
 * have passed since mount (or `resetKey` change). If loading takes longer than
 * `minMs`, the gate opens as soon as `dataReady` becomes true.
 */
export default function useMinLoadingGate(dataReady, minMs = 3000, resetKey) {
  const startedAt = useRef(null);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    setReleased(false);
  }, [resetKey]);

  useEffect(() => {
    if (!dataReady) {
      setReleased(false);
      return;
    }
    const start = startedAt.current ?? Date.now();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minMs - elapsed);
    const id = window.setTimeout(() => setReleased(true), remaining);
    return () => window.clearTimeout(id);
  }, [dataReady, minMs]);

  return !dataReady || !released;
}
