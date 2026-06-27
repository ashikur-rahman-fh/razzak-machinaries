import { API_ROUTES } from '../constants/routes';
import type {
  CustomerFollowUp,
  CustomerFollowUpCompleteWrite,
  CustomerFollowUpUpdate,
  CustomerFollowUpWrite,
  CustomerFollowUpsResponse,
  DashboardFollowUpsParams,
  DashboardFollowUpsResponse,
} from '../types/admin-follow-up';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminFollowUpsApi = {
  getCustomerFollowUps(customerId: number): Promise<CustomerFollowUpsResponse> {
    return backendAdminApi.get<CustomerFollowUpsResponse>(
      API_ROUTES.adminCustomers.followUps(customerId),
    );
  },

  async createCustomerFollowUp(
    customerId: number,
    body: CustomerFollowUpWrite,
  ): Promise<CustomerFollowUp> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerFollowUp, CustomerFollowUpWrite>(
      API_ROUTES.adminCustomers.followUps(customerId),
      body,
    );
  },

  async updateFollowUp(id: number, body: CustomerFollowUpUpdate): Promise<CustomerFollowUp> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<CustomerFollowUp, CustomerFollowUpUpdate>(
      API_ROUTES.adminFollowUps.detail(id),
      body,
    );
  },

  async completeFollowUp(
    id: number,
    body: CustomerFollowUpCompleteWrite = {},
  ): Promise<CustomerFollowUp> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerFollowUp, CustomerFollowUpCompleteWrite>(
      API_ROUTES.adminFollowUps.complete(id),
      body,
    );
  },

  async cancelFollowUp(id: number): Promise<CustomerFollowUp> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerFollowUp, Record<string, never>>(
      API_ROUTES.adminFollowUps.cancel(id),
      {},
    );
  },

  getDashboardFollowUps(params?: DashboardFollowUpsParams): Promise<DashboardFollowUpsResponse> {
    const query: Record<string, string> = {};
    if (params?.asOf) {
      query.asOf = params.asOf;
    }
    return backendAdminApi.get<DashboardFollowUpsResponse>(API_ROUTES.adminDashboard.followUps, {
      params: Object.keys(query).length > 0 ? query : undefined,
    });
  },
};
