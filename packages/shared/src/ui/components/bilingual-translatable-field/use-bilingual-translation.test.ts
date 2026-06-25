import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { adminTranslationsApi } from '../../../api/admin-translations';
import { useBilingualTranslation } from './use-bilingual-translation';

vi.mock('../../../api/admin-translations', () => ({
  adminTranslationsApi: {
    translate: vi.fn(),
  },
}));

describe('useBilingualTranslation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('auto-fills English when Bangla changes', async () => {
    vi.mocked(adminTranslationsApi.translate).mockResolvedValue({
      translatedText: 'Hello',
      provider: 'azure',
    });

    const onEnChange = vi.fn();
    const { rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTranslation({
          bnValue,
          enValue,
          onEnChange,
          debounceMs: 10,
        }),
      { initialProps: { bnValue: '', enValue: '' } },
    );

    rerender({ bnValue: 'হ্যালো', enValue: '' });

    await waitFor(() => {
      expect(onEnChange).toHaveBeenCalledWith('Hello');
    });
  });

  it('does not overwrite English after manual edit', async () => {
    vi.mocked(adminTranslationsApi.translate).mockResolvedValue({
      translatedText: 'Auto text',
      provider: 'azure',
    });

    const onEnChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTranslation({
          bnValue,
          enValue,
          onEnChange,
          debounceMs: 10,
        }),
      { initialProps: { bnValue: 'হ্যালো', enValue: '' } },
    );

    await waitFor(() => {
      expect(onEnChange).toHaveBeenCalledWith('Auto text');
    });

    onEnChange.mockClear();

    act(() => {
      result.current.handleEnChange('Manual text');
    });
    expect(onEnChange).toHaveBeenCalledWith('Manual text');
    onEnChange.mockClear();

    rerender({ bnValue: 'নতুন', enValue: 'Manual text' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onEnChange).not.toHaveBeenCalled();
    expect(result.current.status).toBe('manual');
  });

  it('sets failed status when translation fails', async () => {
    vi.mocked(adminTranslationsApi.translate).mockRejectedValue(new Error('failed'));

    const onEnChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ bnValue, enValue }) =>
        useBilingualTranslation({
          bnValue,
          enValue,
          onEnChange,
          debounceMs: 10,
        }),
      { initialProps: { bnValue: '', enValue: '' } },
    );

    rerender({ bnValue: 'হ্যালো', enValue: '' });

    await waitFor(() => {
      expect(result.current.status).toBe('failed');
    });
  });

  it('does not re-translate when parent re-renders with a new onEnChange reference', async () => {
    vi.mocked(adminTranslationsApi.translate).mockResolvedValue({
      translatedText: 'Hello',
      provider: 'azure',
    });

    const onEnChangeOne = vi.fn();
    const onEnChangeTwo = vi.fn();

    const { rerender } = renderHook(
      ({ bnValue, enValue, onEnChange }) =>
        useBilingualTranslation({
          bnValue,
          enValue,
          onEnChange,
          debounceMs: 10,
        }),
      {
        initialProps: {
          bnValue: 'হ্যালো',
          enValue: '',
          onEnChange: onEnChangeOne,
        },
      },
    );

    await waitFor(() => {
      expect(onEnChangeOne).toHaveBeenCalledWith('Hello');
    });

    rerender({
      bnValue: 'হ্যালো',
      enValue: 'Hello',
      onEnChange: onEnChangeTwo,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(adminTranslationsApi.translate).toHaveBeenCalledTimes(1);
    expect(onEnChangeTwo).not.toHaveBeenCalled();
  });
});
