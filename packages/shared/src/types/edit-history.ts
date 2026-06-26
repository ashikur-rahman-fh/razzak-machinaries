import type { Paginated } from './customer';

export type EditHistoryEventType =
  | 'TRANSACTION_CORRECTED'
  | 'TRANSACTION_VOIDED'
  | 'CUSTOMER_EDITED'
  | 'CUSTOMER_ARCHIVED';

export type EditHistoryEntityType = 'transaction' | 'customer';

export type EditHistoryEvent = {
  id: string;
  eventType: EditHistoryEventType;
  occurredAt: string;
  actorName: string | null;
  reason: string | null;
  entityType: EditHistoryEntityType;
  entityId: number;
  entityLabelEn: string;
  entityLabelBn: string;
  status: string | null;
  customerId: number | null;
  transactionDisplayId: string | null;
};

export type EditHistoryListParams = {
  page?: number;
  pageSize?: number;
  eventType?: EditHistoryEventType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type PaginatedEditHistory = Paginated<EditHistoryEvent>;
