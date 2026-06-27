import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TranslationResponse } from '../types/translation';

const { ensureAdminCsrfMock, postMock } = vi.hoisted(() => ({
  ensureAdminCsrfMock: vi.fn<() => Promise<string>>().mockResolvedValue('fresh-csrf-token'),
  postMock: vi
    .fn<(...args: unknown[]) => Promise<TranslationResponse>>()
    .mockResolvedValue({ translatedText: 'Hello', provider: 'azure' }),
}));

vi.mock('./admin-auth', () => ({
  ensureAdminCsrf: ensureAdminCsrfMock,
}));

vi.mock('./clients/backend-admin', () => ({
  backendAdminApi: {
    post: postMock,
  },
  getAdminCsrfToken: vi.fn().mockReturnValue('stale-cached-token'),
  setAdminCsrfToken: vi.fn(),
  resetAdminCsrfTokenForTests: vi.fn(),
}));

import { adminTranslationsApi } from './admin-translations';

describe('adminTranslationsApi', () => {
  beforeEach(() => {
    ensureAdminCsrfMock.mockClear();
    postMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('always refreshes CSRF before translate even when a token is cached', async () => {
    const result = await adminTranslationsApi.translate({
      text: 'হ্যালো',
      source: 'bn',
      target: 'en',
    });

    expect(ensureAdminCsrfMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith('/api/admin/translations/', {
      text: 'হ্যালো',
      source: 'bn',
      target: 'en',
    });
    expect(result).toEqual({ translatedText: 'Hello', provider: 'azure' });
  });
});
