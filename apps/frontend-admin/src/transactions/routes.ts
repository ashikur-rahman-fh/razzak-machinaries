import type { TransactionListParams, TransactionType } from '@razzak-machinaries/shared/api';

import { resolveBackHref } from '@/edit-history/routes';

const BASE_PATH = '/transactions';

export type TransactionListState = {
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  customerId?: number;
  transactionType?: TransactionType | '';
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_TRANSACTION_ORDERING = '-date';

export function buildListUrl(state?: Partial<TransactionListState>): string {
  const params = new URLSearchParams();
  const page = state?.page ?? 1;
  const pageSize = state?.pageSize ?? 25;
  const search = state?.search ?? '';
  const ordering = state?.ordering ?? DEFAULT_TRANSACTION_ORDERING;

  if (page > 1) params.set('page', String(page));
  if (pageSize !== 25) params.set('pageSize', String(pageSize));
  if (search) params.set('search', search);
  if (ordering && ordering !== DEFAULT_TRANSACTION_ORDERING) params.set('ordering', ordering);
  if (state?.customerId) params.set('customerId', String(state.customerId));
  if (state?.transactionType) params.set('transactionType', state.transactionType);
  if (state?.dateFrom) params.set('dateFrom', state.dateFrom);
  if (state?.dateTo) params.set('dateTo', state.dateTo);

  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export function parseListState(searchParams: URLSearchParams): TransactionListState {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '25') || 25));
  const customerIdRaw = searchParams.get('customerId');
  const customerId = customerIdRaw ? Number(customerIdRaw) : undefined;

  return {
    page,
    pageSize,
    search: searchParams.get('search') ?? '',
    ordering: searchParams.get('ordering') ?? DEFAULT_TRANSACTION_ORDERING,
    customerId: customerId && Number.isFinite(customerId) ? customerId : undefined,
    transactionType: (searchParams.get('transactionType') as TransactionType | null) ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
  };
}

export function buildCreateUrl(options?: {
  customerId?: number;
  type?: 'initial' | 'sale' | 'payment';
}): string {
  const params = new URLSearchParams();
  if (options?.customerId) params.set('customerId', String(options.customerId));
  if (options?.type) params.set('type', options.type);
  const query = params.toString();
  if (options?.customerId) {
    return query
      ? `/customers/${options.customerId}/transactions/new?${query.replace(/^customerId=\d+&?/, '')}`
      : `/customers/${options.customerId}/transactions/new`;
  }
  return query ? `/transactions/new?${query}` : '/transactions/new';
}

export function buildCustomerCreateUrl(
  customerId: number,
  type?: 'initial' | 'sale' | 'payment',
): string {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const query = params.toString();
  return query
    ? `/customers/${customerId}/transactions/new?${query}`
    : `/customers/${customerId}/transactions/new`;
}

export function buildDetailUrl(id: number, listState?: Partial<TransactionListState>): string {
  const listQuery = listState ? buildListUrl(listState).split('?')[1] : undefined;
  const path = `${BASE_PATH}/${id}`;
  return listQuery ? `${path}?from=${encodeURIComponent(listQuery)}` : path;
}

export function getBackListUrl(fromQuery?: string | null): string {
  const editHistoryBack = resolveBackHref(fromQuery);
  if (editHistoryBack) {
    return editHistoryBack;
  }
  if (fromQuery) {
    return `${BASE_PATH}?${fromQuery}`;
  }
  return BASE_PATH;
}

export function buildConfirmationUrl(id: number, options?: { from?: 'detail' }): string {
  const path = `/transactions/${id}/confirmation`;
  return options?.from === 'detail' ? `${path}?from=detail` : path;
}

export function buildCorrectUrl(id: number): string {
  return `${BASE_PATH}/${id}/correct`;
}

export function buildHistoryUrl(id: number): string {
  return `${BASE_PATH}/${id}/history`;
}

export function buildCustomerHistoryUrl(customerId: number): string {
  return `/customers/${customerId}/history`;
}

export function toListParams(state: TransactionListState): TransactionListParams {
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    ordering: state.ordering || undefined,
    customerId: state.customerId,
    transactionType: state.transactionType || undefined,
    dateFrom: state.dateFrom || undefined,
    dateTo: state.dateTo || undefined,
  };
}
