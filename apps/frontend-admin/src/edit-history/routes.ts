import type { EditHistoryEventType } from '@razzak-machinaries/shared/api';

export const EDIT_HISTORY_FROM = 'edit-history';

export type EditHistoryListState = {
  page: number;
  pageSize: number;
  search: string;
  eventType: EditHistoryEventType | '';
};

export const DEFAULT_EDIT_HISTORY_PAGE_SIZE = 25;

export function buildListUrl(state?: Partial<EditHistoryListState>): string {
  const params = new URLSearchParams();
  const page = state?.page ?? 1;
  const pageSize = state?.pageSize ?? DEFAULT_EDIT_HISTORY_PAGE_SIZE;
  const search = state?.search ?? '';
  const eventType = state?.eventType ?? '';

  if (page > 1) params.set('page', String(page));
  if (pageSize !== DEFAULT_EDIT_HISTORY_PAGE_SIZE) params.set('pageSize', String(pageSize));
  if (search) params.set('search', search);
  if (eventType) params.set('eventType', eventType);

  const query = params.toString();
  return query ? `/edit-history?${query}` : '/edit-history';
}

export function parseListState(searchParams: URLSearchParams): EditHistoryListState {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(
    200,
    Math.max(
      1,
      Number(searchParams.get('pageSize') ?? String(DEFAULT_EDIT_HISTORY_PAGE_SIZE)) ||
        DEFAULT_EDIT_HISTORY_PAGE_SIZE,
    ),
  );
  const eventTypeRaw = searchParams.get('eventType');

  return {
    page,
    pageSize,
    search: searchParams.get('search') ?? '',
    eventType: (eventTypeRaw as EditHistoryEventType | null) ?? '',
  };
}

export function buildEntityDetailUrl(
  entityType: 'transaction' | 'customer',
  entityId: number,
  eventType?: EditHistoryEventType,
): string {
  if (entityType === 'transaction') {
    return `/transactions/${entityId}?from=${EDIT_HISTORY_FROM}`;
  }
  if (eventType === 'CUSTOMER_EDITED') {
    return `/customers/${entityId}/history?from=${EDIT_HISTORY_FROM}`;
  }
  return `/customers/${entityId}?from=${EDIT_HISTORY_FROM}`;
}

export function resolveBackHref(fromQuery?: string | null): string | null {
  if (fromQuery === EDIT_HISTORY_FROM) {
    return '/edit-history';
  }
  return null;
}
