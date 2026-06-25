'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LARGE_SCREEN_QUERY = '(min-width: 1024px)';

export function useLargeScreen(): boolean {
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia(LARGE_SCREEN_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    const handleChange = () => setIsLargeScreen(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isLargeScreen;
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export type AsyncStatus<T> =
  | { status: 'idle' }
  | { status: 'loading'; data?: T; resetKey?: unknown }
  | { status: 'success'; data: T; resetKey: unknown }
  | { status: 'error'; error: unknown; data?: T; resetKey?: unknown };

export function getAsyncData<T>(state: AsyncStatus<T>): T | null {
  if (state.status === 'success') return state.data;
  if ('data' in state && state.data !== undefined) return state.data;
  return null;
}

export function getAsyncResetKey<T>(state: AsyncStatus<T>): unknown | undefined {
  if ('resetKey' in state) return state.resetKey;
  return undefined;
}

export function isAsyncInitialLoad<T>(state: AsyncStatus<T>): boolean {
  return (state.status === 'idle' || state.status === 'loading') && getAsyncData(state) === null;
}

function getPreviousResetKey<T>(state: AsyncStatus<T>): unknown | undefined {
  return getAsyncResetKey(state);
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options?: { keepPreviousData?: boolean; resetKey?: unknown },
) {
  const loaderRef = useRef(loader);
  const keepPreviousData = options?.keepPreviousData ?? true;
  const resetKey = options?.resetKey;
  const resetKeyRef = useRef(resetKey);

  const requestIdRef = useRef(0);
  const [state, setState] = useState<AsyncStatus<T>>({ status: 'idle' });

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const resetKeyChanged = resetKeyRef.current !== resetKey;
    resetKeyRef.current = resetKey;

    setState((previous) => {
      const previousData = keepPreviousData && !resetKeyChanged ? getAsyncData(previous) : null;
      const previousResetKey = getPreviousResetKey(previous);
      return previousData !== null
        ? { status: 'loading', data: previousData, resetKey: previousResetKey ?? resetKey }
        : { status: 'loading', resetKey };
    });
    try {
      const data = await loaderRef.current();
      if (requestId !== requestIdRef.current) return;
      setState({ status: 'success', data, resetKey });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState((previous) => {
        const previousData = keepPreviousData && !resetKeyChanged ? getAsyncData(previous) : null;
        const previousResetKey = getPreviousResetKey(previous);
        return previousData !== null
          ? { status: 'error', error, data: previousData, resetKey: previousResetKey ?? resetKey }
          : { status: 'error', error, resetKey };
      });
    }
  }, [keepPreviousData, resetKey]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps drive reload
  }, [reload, ...deps]);

  return { state, reload };
}
