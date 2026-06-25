import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { banglaToLatinDigitsOnly, banglaToLatinPhone } from '../../../i18n/bangla-script-utils';
import { useBilingualTransliteration } from './use-bilingual-transliteration';

describe('useBilingualTransliteration', () => {
  it('auto-fills Latin when Bangla changes', () => {
    const onEnChange = vi.fn();
    const { rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTransliteration({
          bnValue,
          enValue,
          onEnChange,
          convert: banglaToLatinPhone,
        }),
      { initialProps: { bnValue: '', enValue: '' } },
    );

    rerender({ bnValue: '০১৭১২৩৪৫৬৭৮', enValue: '' });

    expect(onEnChange).toHaveBeenCalledWith('01712345678');
  });

  it('does not overwrite Latin after manual edit', () => {
    const onEnChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTransliteration({
          bnValue,
          enValue,
          onEnChange,
          convert: banglaToLatinDigitsOnly,
        }),
      { initialProps: { bnValue: '১২৩', enValue: '' } },
    );

    expect(onEnChange).toHaveBeenCalledWith('123');
    onEnChange.mockClear();

    act(() => {
      result.current.handleEnChange('999');
    });
    onEnChange.mockClear();

    rerender({ bnValue: '৪৫৬', enValue: '999' });
    expect(onEnChange).not.toHaveBeenCalled();
    expect(result.current.status).toBe('manual');
  });

  it('does not re-convert when parent re-renders with a new onEnChange reference', () => {
    const onEnChangeOne = vi.fn();
    const onEnChangeTwo = vi.fn();

    const { rerender } = renderHook(
      ({ bnValue, enValue, onEnChange }) =>
        useBilingualTransliteration({
          bnValue,
          enValue,
          onEnChange,
          convert: banglaToLatinDigitsOnly,
        }),
      {
        initialProps: {
          bnValue: '১২৩',
          enValue: '',
          onEnChange: onEnChangeOne,
        },
      },
    );

    expect(onEnChangeOne).toHaveBeenCalledTimes(1);

    rerender({
      bnValue: '১২৩',
      enValue: '123',
      onEnChange: onEnChangeTwo,
    });

    expect(onEnChangeTwo).not.toHaveBeenCalled();
  });

  it('reconvert applies latest Bangla input', () => {
    const onEnChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTransliteration({
          bnValue,
          enValue,
          onEnChange,
          convert: banglaToLatinDigitsOnly,
        }),
      { initialProps: { bnValue: '১২৩', enValue: '999' } },
    );

    act(() => {
      result.current.handleEnChange('999');
    });
    onEnChange.mockClear();

    rerender({ bnValue: '৪৫৬', enValue: '999' });

    act(() => {
      result.current.reconvert();
    });

    expect(onEnChange).toHaveBeenCalledWith('456');
  });
});
