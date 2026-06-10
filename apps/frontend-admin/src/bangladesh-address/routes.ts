import type { GeoListState, GeoResourceType } from './types';

const BASE_PATH = '/bangladesh-address';

export function buildListUrl(state?: Partial<GeoListState>): string {
  const params = new URLSearchParams();
  const type = state?.type ?? 'divisions';
  params.set('type', type);

  if (state?.page && state.page > 1) {
    params.set('page', String(state.page));
  }
  if (state?.pageSize && state.pageSize !== 25) {
    params.set('pageSize', String(state.pageSize));
  }
  if (state?.search) {
    params.set('search', state.search);
  }
  if (state?.ordering && state.ordering !== 'nameEn') {
    params.set('ordering', state.ordering);
  }
  if (state?.divisionId) {
    params.set('divisionId', String(state.divisionId));
  }
  if (state?.districtId) {
    params.set('districtId', String(state.districtId));
  }
  if (state?.upazilaId) {
    params.set('upazilaId', String(state.upazilaId));
  }

  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export function buildDetailUrl(
  type: GeoResourceType,
  id: number,
  listState?: Partial<GeoListState>,
): string {
  const listQuery = listState ? buildListUrl(listState).split('?')[1] : undefined;
  const path = `${BASE_PATH}/${type}/${id}`;
  return listQuery ? `${path}?from=${encodeURIComponent(listQuery)}` : path;
}

export function buildEditUrl(
  type: GeoResourceType,
  id: number,
  listState?: Partial<GeoListState>,
): string {
  const detail = buildDetailUrl(type, id, listState);
  return `${detail}/edit`;
}

export function parseListState(searchParams: URLSearchParams): GeoListState {
  const typeParam = searchParams.get('type') ?? 'divisions';
  const type =
    typeParam === 'divisions' ||
    typeParam === 'districts' ||
    typeParam === 'upazilas' ||
    typeParam === 'unions'
      ? typeParam
      : 'divisions';

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? '25') || 25));
  const search = searchParams.get('search') ?? '';
  const ordering = searchParams.get('ordering') ?? 'nameEn';

  const state: GeoListState = { type, page, pageSize, search, ordering };

  const divisionId = Number(searchParams.get('divisionId'));
  if (divisionId > 0) state.divisionId = divisionId;

  const districtId = Number(searchParams.get('districtId'));
  if (districtId > 0) state.districtId = districtId;

  const upazilaId = Number(searchParams.get('upazilaId'));
  if (upazilaId > 0) state.upazilaId = upazilaId;

  return state;
}

export function toListParams(state: GeoListState) {
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    ordering: state.ordering || undefined,
    divisionId: state.divisionId,
    districtId: state.districtId,
    upazilaId: state.upazilaId,
  };
}

export function getBackListUrl(fromQuery?: string | null): string {
  if (fromQuery) {
    return `${BASE_PATH}?${fromQuery}`;
  }
  return BASE_PATH;
}
