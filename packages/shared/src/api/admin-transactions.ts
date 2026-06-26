import { API_ROUTES } from '../constants/routes';
import type {
  CustomerBalance,
  Paginated,
  Transaction,
  TransactionConfirmation,
  TransactionCorrectionResponse,
  TransactionCorrectionWrite,
  TransactionHistory,
  TransactionListParams,
  TransactionVoidResponse,
  TransactionVoidWrite,
  TransactionWrite,
} from '../types/transaction';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(
  params?: TransactionListParams,
): Record<string, string | number | boolean> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number | boolean> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.customerId !== undefined) query.customerId = params.customerId;
  if (params.transactionType !== undefined) query.transactionType = params.transactionType;
  if (params.dateFrom !== undefined) query.dateFrom = params.dateFrom;
  if (params.dateTo !== undefined) query.dateTo = params.dateTo;
  if (params.search !== undefined) query.search = params.search;
  if (params.ordering !== undefined) query.ordering = params.ordering;
  if (params.status !== undefined) query.status = params.status;
  if (params.includeHistory !== undefined) query.includeHistory = params.includeHistory;

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

  getTransactionHistory(id: number): Promise<TransactionHistory> {
    return backendAdminApi.get<TransactionHistory>(API_ROUTES.adminTransactions.history(id));
  },

  async createTransaction(body: TransactionWrite): Promise<Transaction> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<Transaction, TransactionWrite>(
      API_ROUTES.adminTransactions.list,
      body,
    );
  },

  async createCorrection(
    id: number,
    body: TransactionCorrectionWrite,
  ): Promise<TransactionCorrectionResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<TransactionCorrectionResponse, TransactionCorrectionWrite>(
      API_ROUTES.adminTransactions.createCorrection(id),
      body,
    );
  },

  async voidTransaction(id: number, body: TransactionVoidWrite): Promise<TransactionVoidResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<TransactionVoidResponse, TransactionVoidWrite>(
      API_ROUTES.adminTransactions.void(id),
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
