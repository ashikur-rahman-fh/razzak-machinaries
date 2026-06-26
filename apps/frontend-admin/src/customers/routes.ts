import type { CustomerListParams } from '@razzak-machinaries/shared/api';

import { resolveBackHref } from '@/edit-history/routes';

const BASE_PATH = '/customers';

export type CustomerListState = {
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
};

export const DEFAULT_CUSTOMER_ORDERING = '-createdAt';
export const RELEVANCE_CUSTOMER_ORDERING = 'relevance';

export function resolveOrderingForSearchChange(
  nextSearch: string,
  currentOrdering: string,
): string {
  if (nextSearch) {
    if (currentOrdering === DEFAULT_CUSTOMER_ORDERING) {
      return RELEVANCE_CUSTOMER_ORDERING;
    }
    return currentOrdering;
  }
  if (currentOrdering === RELEVANCE_CUSTOMER_ORDERING) {
    return DEFAULT_CUSTOMER_ORDERING;
  }
  return currentOrdering;
}

export function buildListUrl(state?: Partial<CustomerListState>): string {
  const params = new URLSearchParams();
  const page = state?.page ?? 1;
  const pageSize = state?.pageSize ?? 25;
  const search = state?.search ?? '';
  const ordering = state?.ordering ?? DEFAULT_CUSTOMER_ORDERING;

  if (page > 1) {
    params.set('page', String(page));
  }
  if (pageSize !== 25) {
    params.set('pageSize', String(pageSize));
  }
  if (search) {
    params.set('search', search);
  }
  if (ordering && ordering !== DEFAULT_CUSTOMER_ORDERING) {
    params.set('ordering', ordering);
  }

  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export function parseListState(searchParams: URLSearchParams): CustomerListState {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '25') || 25));
  const search = searchParams.get('search') ?? '';
  const ordering = searchParams.get('ordering') ?? DEFAULT_CUSTOMER_ORDERING;

  return { page, pageSize, search, ordering };
}

export function buildDetailUrl(id: number, listState?: Partial<CustomerListState>): string {
  const listQuery = listState ? buildListUrl(listState).split('?')[1] : undefined;
  const path = `${BASE_PATH}/${id}`;
  return listQuery ? `${path}?from=${encodeURIComponent(listQuery)}` : path;
}

export function buildEditUrl(id: number, listState?: Partial<CustomerListState>): string {
  return `${buildDetailUrl(id, listState)}/edit`;
}

export function buildCustomerHistoryUrl(customerId: number): string {
  return `${BASE_PATH}/${customerId}/history`;
}

export function buildCustomerVersionDetailUrl(customerId: number, versionId: number): string {
  return `${BASE_PATH}/${customerId}/history/${versionId}`;
}

export function getBackListUrl(fromQuery?: string | null, canAccessEditHistory = false): string {
  const editHistoryBack = resolveBackHref(fromQuery);
  if (editHistoryBack && canAccessEditHistory) {
    return editHistoryBack;
  }
  if (fromQuery && fromQuery !== 'edit-history') {
    return `${BASE_PATH}?${fromQuery}`;
  }
  return BASE_PATH;
}

export function toListParams(state: CustomerListState): CustomerListParams {
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    ordering: state.ordering || undefined,
  };
}
