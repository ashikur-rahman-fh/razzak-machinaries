import type { StaffUserListParams } from '@razzak-machinaries/shared/api';

const BASE_PATH = '/staff-users';

export type StaffListState = {
  page: number;
  pageSize: number;
  search: string;
  status: '' | 'active' | 'inactive';
  ordering: string;
};

export const DEFAULT_STAFF_ORDERING = '-createdAt';

export function buildListUrl(state?: Partial<StaffListState>): string {
  const params = new URLSearchParams();
  const page = state?.page ?? 1;
  const pageSize = state?.pageSize ?? 25;
  const search = state?.search ?? '';
  const status = state?.status ?? '';
  const ordering = state?.ordering ?? DEFAULT_STAFF_ORDERING;

  if (page > 1) params.set('page', String(page));
  if (pageSize !== 25) params.set('pageSize', String(pageSize));
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (ordering && ordering !== DEFAULT_STAFF_ORDERING) params.set('ordering', ordering);

  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export function parseListState(searchParams: URLSearchParams): StaffListState {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '25') || 25));
  const search = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status') ?? '';
  const status =
    statusParam === 'active' || statusParam === 'inactive' ? statusParam : ('' as const);
  const ordering = searchParams.get('ordering') ?? DEFAULT_STAFF_ORDERING;

  return { page, pageSize, search, status, ordering };
}

export function buildDetailUrl(id: number, listState?: Partial<StaffListState>): string {
  const listQuery = listState ? buildListUrl(listState).split('?')[1] : undefined;
  const path = `${BASE_PATH}/${id}`;
  return listQuery ? `${path}?from=${encodeURIComponent(listQuery)}` : path;
}

export function buildCreateUrl(): string {
  return `${BASE_PATH}/new`;
}

export function getBackListUrl(fromQuery?: string | null): string {
  if (fromQuery) {
    return `${BASE_PATH}?${fromQuery}`;
  }
  return BASE_PATH;
}

export function toListParams(state: StaffListState): StaffUserListParams {
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    status: state.status || undefined,
    ordering: state.ordering || undefined,
  };
}
