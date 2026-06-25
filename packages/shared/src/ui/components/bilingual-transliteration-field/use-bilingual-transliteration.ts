'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type TransliterationStatus = 'idle' | 'auto' | 'manual';

type UseBilingualTransliterationOptions = {
  bnValue: string;
  enValue: string;
  onEnChange: (value: string) => void;
  convert: (text: string) => string;
};

export function useBilingualTransliteration({
  bnValue,
  enValue,
  onEnChange,
  convert,
}: UseBilingualTransliterationOptions) {
  const [status, setStatus] = useState<TransliterationStatus>('idle');
  const statusRef = useRef<TransliterationStatus>('idle');
  const lastAutoEnRef = useRef('');
  const lastConvertedBnRef = useRef('');
  const enValueRef = useRef(enValue);
  const onEnChangeRef = useRef(onEnChange);
  const convertRef = useRef(convert);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    enValueRef.current = enValue;
  }, [enValue]);

  useEffect(() => {
    onEnChangeRef.current = onEnChange;
  }, [onEnChange]);

  useEffect(() => {
    convertRef.current = convert;
  }, [convert]);

  const runConversion = useCallback((text: string, force = false) => {
    const trimmed = text.trim();
    if (!trimmed) {
      lastConvertedBnRef.current = '';
      setStatus('idle');
      return;
    }

    if (!force && statusRef.current === 'manual') {
      return;
    }

    if (!force && trimmed === lastConvertedBnRef.current) {
      return;
    }

    const converted = convertRef.current(trimmed);
    const currentEn = enValueRef.current.trim();
    const shouldApply = !currentEn || currentEn === lastAutoEnRef.current || force;

    if (shouldApply) {
      lastAutoEnRef.current = converted;
      lastConvertedBnRef.current = trimmed;
      onEnChangeRef.current(converted);
      setStatus('auto');
    }
  }, []);

  useEffect(() => {
    if (statusRef.current === 'manual') {
      return;
    }
    runConversion(bnValue);
  }, [bnValue, runConversion]);

  const handleEnChange = useCallback((value: string) => {
    if (value.trim() !== lastAutoEnRef.current.trim()) {
      statusRef.current = 'manual';
      setStatus('manual');
    }
    onEnChangeRef.current(value);
  }, []);

  const reconvert = useCallback(() => {
    statusRef.current = 'auto';
    setStatus('auto');
    runConversion(bnValue, true);
  }, [bnValue, runConversion]);

  return {
    status,
    handleEnChange,
    reconvert,
  };
}
