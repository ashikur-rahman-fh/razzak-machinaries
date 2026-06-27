import { API_ROUTES } from '../constants/routes';
import type {
  Halkhata,
  HalkhataListParams,
  HalkhataPaymentWrite,
  HalkhataStats,
  HalkhataTransaction,
  HalkhataTransactionListParams,
  HalkhataUpdate,
  HalkhataWrite,
  Paginated,
} from '../types/halkhata';
import type { Transaction } from '../types/transaction';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toListParams(params?: HalkhataListParams): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.status !== undefined) query.status = params.status;
  return Object.keys(query).length > 0 ? query : undefined;
}

function toTransactionListParams(
  params?: HalkhataTransactionListParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.search !== undefined) query.search = params.search;
  if (params.ordering !== undefined) query.ordering = params.ordering;
  return Object.keys(query).length > 0 ? query : undefined;
}

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminHalkhataApi = {
  listHalkhatas(params?: HalkhataListParams): Promise<Paginated<Halkhata>> {
    return backendAdminApi.get<Paginated<Halkhata>>(API_ROUTES.adminHalkhatas.list, {
      params: toListParams(params),
    });
  },

  getHalkhata(id: number): Promise<Halkhata> {
    return backendAdminApi.get<Halkhata>(API_ROUTES.adminHalkhatas.detail(id));
  },

  async createHalkhata(body: HalkhataWrite): Promise<Halkhata> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Halkhata, HalkhataWrite>(API_ROUTES.adminHalkhatas.list, body);
  },

  async updateHalkhata(id: number, body: HalkhataUpdate): Promise<Halkhata> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<Halkhata, HalkhataUpdate>(
      API_ROUTES.adminHalkhatas.detail(id),
      body,
    );
  },

  getHalkhataStats(id: number): Promise<HalkhataStats> {
    return backendAdminApi.get<HalkhataStats>(API_ROUTES.adminHalkhatas.stats(id));
  },

  listHalkhataTransactions(
    id: number,
    params?: HalkhataTransactionListParams,
  ): Promise<Paginated<HalkhataTransaction>> {
    return backendAdminApi.get<Paginated<HalkhataTransaction>>(
      API_ROUTES.adminHalkhatas.transactions(id),
      { params: toTransactionListParams(params) },
    );
  },

  async createHalkhataPayment(id: number, body: HalkhataPaymentWrite): Promise<Transaction> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Transaction, HalkhataPaymentWrite>(
      API_ROUTES.adminHalkhatas.payments(id),
      body,
    );
  },
};
