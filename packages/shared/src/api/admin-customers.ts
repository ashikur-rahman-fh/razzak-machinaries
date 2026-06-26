import { API_ROUTES } from '../constants/routes';
import type {
  Customer,
  CustomerArchiveResponse,
  CustomerArchiveWrite,
  CustomerHistory,
  CustomerListParams,
  CustomerVersionResponse,
  CustomerVersionWrite,
  CustomerWrite,
  Paginated,
} from '../types/customer';
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
  if (params.status !== undefined) query.status = params.status;

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

  getCustomerHistory(id: number): Promise<CustomerHistory> {
    return backendAdminApi.get<CustomerHistory>(API_ROUTES.adminCustomers.history(id));
  },

  async createCustomer(formData: FormData): Promise<Customer> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Customer, FormData>(API_ROUTES.adminCustomers.list, formData);
  },

  async createCustomerJson(body: CustomerWrite): Promise<Customer> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Customer, CustomerWrite>(API_ROUTES.adminCustomers.list, body);
  },

  async createCustomerVersion(id: number, formData: FormData): Promise<CustomerVersionResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerVersionResponse, FormData>(
      API_ROUTES.adminCustomers.createVersion(id),
      formData,
    );
  },

  async createCustomerVersionJson(
    id: number,
    body: CustomerVersionWrite,
  ): Promise<CustomerVersionResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerVersionResponse, CustomerVersionWrite>(
      API_ROUTES.adminCustomers.createVersion(id),
      body,
    );
  },

  async archiveCustomer(id: number, body: CustomerArchiveWrite): Promise<CustomerArchiveResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<CustomerArchiveResponse, CustomerArchiveWrite>(
      API_ROUTES.adminCustomers.archive(id),
      body,
    );
  },
};
