'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminTranslationsApi } from '../../../api/admin-translations';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export type TranslationStatus = 'idle' | 'translating' | 'auto' | 'manual' | 'failed';

type UseBilingualTranslationOptions = {
  bnValue: string;
  enValue: string;
  onEnChange: (value: string) => void;
  debounceMs?: number;
};

export function useBilingualTranslation({
  bnValue,
  enValue,
  onEnChange,
  debounceMs = 400,
}: UseBilingualTranslationOptions) {
  const [status, setStatus] = useState<TranslationStatus>('idle');
  const statusRef = useRef<TranslationStatus>('idle');
  const lastAutoEnRef = useRef('');
  const lastTranslatedBnRef = useRef('');
  const enValueRef = useRef(enValue);
  const onEnChangeRef = useRef(onEnChange);
  const requestIdRef = useRef(0);
  const debouncedBn = useDebouncedValue(bnValue, debounceMs);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    enValueRef.current = enValue;
  }, [enValue]);

  useEffect(() => {
    onEnChangeRef.current = onEnChange;
  }, [onEnChange]);

  const runTranslation = useCallback(async (text: string, force = false) => {
    const trimmed = text.trim();
    if (!trimmed) {
      lastTranslatedBnRef.current = '';
      setStatus('idle');
      return;
    }

    if (!force && statusRef.current === 'manual') {
      return;
    }

    if (!force && trimmed === lastTranslatedBnRef.current) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('translating');

    try {
      const result = await adminTranslationsApi.translate({
        text: trimmed,
        source: 'bn',
        target: 'en',
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!force && statusRef.current === 'manual') {
        return;
      }

      const currentEn = enValueRef.current.trim();
      const shouldApply = !currentEn || currentEn === lastAutoEnRef.current || force;
      if (shouldApply) {
        lastAutoEnRef.current = result.translatedText;
        lastTranslatedBnRef.current = trimmed;
        onEnChangeRef.current(result.translatedText);
        setStatus('auto');
      }
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!force && statusRef.current === 'manual') {
        return;
      }
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    if (statusRef.current === 'manual') {
      return;
    }
    void runTranslation(debouncedBn);
  }, [debouncedBn, runTranslation]);

  const handleEnChange = useCallback((value: string) => {
    if (value.trim() !== lastAutoEnRef.current.trim()) {
      statusRef.current = 'manual';
      setStatus('manual');
    }
    onEnChangeRef.current(value);
  }, []);

  const retranslate = useCallback(async () => {
    await runTranslation(bnValue, true);
  }, [bnValue, runTranslation]);

  return {
    status,
    handleEnChange,
    retranslate,
  };
}
