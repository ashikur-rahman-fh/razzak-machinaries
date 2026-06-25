import { API_ROUTES } from '../constants/routes';
import type { Customer, CustomerListParams, CustomerWrite, Paginated } from '../types/customer';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(params?: CustomerListParams): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }

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

export const adminCustomersApi = {
  listCustomers(params?: CustomerListParams): Promise<Paginated<Customer>> {
    return backendAdminApi.get<Paginated<Customer>>(API_ROUTES.adminCustomers.list, {
      params: toQueryParams(params),
    });
  },

  getCustomer(id: number): Promise<Customer> {
    return backendAdminApi.get<Customer>(API_ROUTES.adminCustomers.detail(id));
  },

  async createCustomer(formData: FormData): Promise<Customer> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Customer, FormData>(API_ROUTES.adminCustomers.list, formData);
  },

  async updateCustomer(id: number, formData: FormData): Promise<Customer> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<Customer, FormData>(
      API_ROUTES.adminCustomers.detail(id),
      formData,
    );
  },

  async createCustomerJson(body: CustomerWrite): Promise<Customer> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Customer, CustomerWrite>(API_ROUTES.adminCustomers.list, body);
  },

  async deleteCustomer(id: number): Promise<void> {
    await ensureCsrfForWrite();
    await backendAdminApi.delete<void>(API_ROUTES.adminCustomers.detail(id));
  },
};
