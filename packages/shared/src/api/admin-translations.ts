import { API_ROUTES } from '../constants/routes';
import type { TranslationRequest, TranslationResponse } from '../types/translation';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi, getAdminCsrfToken } from './clients/backend-admin';

export const adminTranslationsApi = {
  async translate(body: TranslationRequest): Promise<TranslationResponse> {
    if (!getAdminCsrfToken()) {
      await ensureAdminCsrf();
    }
    return backendAdminApi.post<TranslationResponse, TranslationRequest>(
      API_ROUTES.adminTranslations,
      body,
    );
  },
};
