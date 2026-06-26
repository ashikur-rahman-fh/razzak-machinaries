import { API_ROUTES } from '../constants/routes';
import type {
  CustomerBalance,
  Paginated,
  Transaction,
  TransactionConfirmation,
  TransactionListParams,
  TransactionWrite,
} from '../types/transaction';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(
  params?: TransactionListParams,
): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.customerId !== undefined) query.customerId = params.customerId;
  if (params.transactionType !== undefined) query.transactionType = params.transactionType;
  if (params.dateFrom !== undefined) query.dateFrom = params.dateFrom;
  if (params.dateTo !== undefined) query.dateTo = params.dateTo;
  if (params.search !== undefined) query.search = params.search;
  if (params.ordering !== undefined) query.ordering = params.ordering;

  return Object.keys(query).length > 0 ? query : undefined;
}

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminTransactionsApi = {
  listTransactions(params?: TransactionListParams): Promise<Paginated<Transaction>> {
    return backendAdminApi.get<Paginated<Transaction>>(API_ROUTES.adminTransactions.list, {
      params: toQueryParams(params),
    });
  },

  getTransaction(id: number): Promise<Transaction> {
    return backendAdminApi.get<Transaction>(API_ROUTES.adminTransactions.detail(id));
  },

  getTransactionConfirmation(id: number): Promise<TransactionConfirmation> {
    return backendAdminApi.get<TransactionConfirmation>(
      API_ROUTES.adminTransactions.confirmation(id),
    );
  },

  async createTransaction(body: TransactionWrite): Promise<Transaction> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Transaction, TransactionWrite>(
      API_ROUTES.adminTransactions.list,
      body,
    );
  },

  getCustomerBalance(customerId: number): Promise<CustomerBalance> {
    return backendAdminApi.get<CustomerBalance>(API_ROUTES.adminCustomers.balance(customerId));
  },

  listCustomerTransactions(
    customerId: number,
    params?: Omit<TransactionListParams, 'customerId'>,
  ): Promise<Paginated<Transaction>> {
    return backendAdminApi.get<Paginated<Transaction>>(
      API_ROUTES.adminCustomers.transactions(customerId),
      { params: toQueryParams(params) },
    );
  },
};
