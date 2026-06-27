import type {
  HalkhataListParams,
  HalkhataStatus,
  HalkhataTransactionListParams,
} from '@razzak-machinaries/shared/api';
import type { ReadonlyURLSearchParams } from 'next/navigation';

import { todayIsoDate } from '@/transactions/constants';

type SearchParamsLike = URLSearchParams | ReadonlyURLSearchParams;

export type HalkhataListState = {
  page: number;
  status: '' | HalkhataStatus;
};

export type HalkhataTransactionListState = {
  page: number;
  search: string;
};

const DEFAULT_PAGE = 1;

export function parseListState(searchParams: SearchParamsLike): HalkhataListState {
  const page = Number(searchParams.get('page') ?? DEFAULT_PAGE);
  const statusParam = searchParams.get('status') ?? '';
  const status = statusParam === 'active' || statusParam === 'closed' ? statusParam : ('' as const);
  return {
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_PAGE,
    status,
  };
}

export function parseTransactionListState(
  searchParams: SearchParamsLike,
): HalkhataTransactionListState {
  const page = Number(searchParams.get('page') ?? DEFAULT_PAGE);
  return {
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_PAGE,
    search: searchParams.get('search') ?? '',
  };
}

export function buildListUrl(state: Partial<HalkhataListState>): string {
  const params = new URLSearchParams();
  const page = state.page ?? DEFAULT_PAGE;
  const status = state.status ?? '';
  if (page > 1) params.set('page', String(page));
  if (status) params.set('status', status);
  const query = params.toString();
  return query ? `/halkhata?${query}` : '/halkhata';
}

export function buildDetailUrl(id: number): string {
  return `/halkhata/${id}`;
}

export function buildDetailTransactionsUrl(
  id: number,
  state: Partial<HalkhataTransactionListState>,
): string {
  const params = new URLSearchParams();
  const page = state.page ?? DEFAULT_PAGE;
  if (page > 1) params.set('page', String(page));
  if (state.search) params.set('search', state.search);
  const query = params.toString();
  return query ? `/halkhata/${id}?${query}` : `/halkhata/${id}`;
}

export function toListParams(state: HalkhataListState): HalkhataListParams {
  return {
    page: state.page,
    pageSize: 25,
    status: state.status || undefined,
  };
}

export function toTransactionListParams(
  state: HalkhataTransactionListState,
): HalkhataTransactionListParams {
  return {
    page: state.page,
    pageSize: 25,
    search: state.search || undefined,
    ordering: '-createdAt',
  };
}

export function defaultHalkhataDate(): string {
  return todayIsoDate();
}

export type CreateHalkhataFormValues = {
  title: string;
  date: string;
};

export function defaultCreateHalkhataValues(): CreateHalkhataFormValues {
  return {
    title: '',
    date: defaultHalkhataDate(),
  };
}
