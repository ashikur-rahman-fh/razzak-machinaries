import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, USER_MESSAGES } from '../api/errors';
import { useApi } from './useApi';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useApi', () => {
  it('ignores stale responses when reload resolves out of order', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    let callCount = 0;

    const loader = vi.fn(() => {
      callCount += 1;
      return callCount === 1 ? first.promise : second.promise;
    });

    const { result } = renderHook(() => useApi(loader));

    await waitFor(() => {
      expect(result.current.state.status).toBe('loading');
    });

    await act(async () => {
      void result.current.reload();
    });

    await act(async () => {
      second.resolve('newer');
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'success', data: 'newer' });
    });

    await act(async () => {
      first.resolve('stale');
    });

    expect(result.current.state).toEqual({ status: 'success', data: 'newer' });
  });

  it('does not update state after unmount', async () => {
    const pending = deferred<string>();
    const loader = vi.fn(() => pending.promise);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useApi(loader));

    await waitFor(() => {
      expect(result.current.state.status).toBe('loading');
    });

    unmount();

    await act(async () => {
      pending.resolve('late');
    });

    consoleError.mockRestore();
  });

  it('surfaces ApiError instances for localized rendering', async () => {
    const apiError = new ApiError({ message: USER_MESSAGES.notFound, status: 404 });
    const loader = vi.fn().mockRejectedValue(apiError);

    const { result } = renderHook(() => useApi(loader));

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
      if (result.current.state.status === 'error') {
        expect(result.current.state.error).toBe(apiError);
      }
    });
  });

  it('surfaces unexpected errors for localized rendering', async () => {
    const unexpected = new Error('Request failed with status 500');
    const loader = vi.fn().mockRejectedValue(unexpected);

    const { result } = renderHook(() => useApi(loader));

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
      if (result.current.state.status === 'error') {
        expect(result.current.state.error).toBe(unexpected);
      }
    });
  });
});
