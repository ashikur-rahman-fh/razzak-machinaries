import { API_ROUTES } from '../constants/routes';
import type { EditHistoryListParams, PaginatedEditHistory } from '../types/edit-history';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(
  params?: EditHistoryListParams,
): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.eventType !== undefined) query.eventType = params.eventType;
  if (params.search !== undefined) query.search = params.search;
  if (params.dateFrom !== undefined) query.dateFrom = params.dateFrom;
  if (params.dateTo !== undefined) query.dateTo = params.dateTo;

  return Object.keys(query).length > 0 ? query : undefined;
}

export const adminEditHistoryApi = {
  listEditHistory(params?: EditHistoryListParams): Promise<PaginatedEditHistory> {
    return backendAdminApi.get<PaginatedEditHistory>(API_ROUTES.adminEditHistory.list, {
      params: toQueryParams(params),
    });
  },
};
