import type { EditHistoryEvent } from '@razzak-machinaries/shared/api';

export const sampleEditHistoryEvents: EditHistoryEvent[] = [
  {
    id: 'tx-void-6',
    eventType: 'TRANSACTION_VOIDED',
    occurredAt: '2026-06-26T14:30:00Z',
    actorName: 'admin',
    reason: 'Duplicate entry',
    entityType: 'transaction',
    entityId: 6,
    entityLabelEn: 'Sale — Rahim Uddin',
    entityLabelBn: 'Sale — রহিম উদ্দিন',
    status: 'VOIDED',
    customerId: 42,
    transactionDisplayId: 'COM-6',
  },
  {
    id: 'tx-correct-7',
    eventType: 'TRANSACTION_CORRECTED',
    occurredAt: '2026-06-26T12:00:00Z',
    actorName: 'admin',
    reason: 'Fixed amount',
    entityType: 'transaction',
    entityId: 7,
    entityLabelEn: 'Initial Balance — Rahim Uddin',
    entityLabelBn: 'Initial Balance — রহিম উদ্দিন',
    status: 'ACTIVE',
    customerId: 42,
    transactionDisplayId: 'COM-7',
  },
  {
    id: 'customer-edit-2',
    eventType: 'CUSTOMER_EDITED',
    occurredAt: '2026-06-25T10:00:00Z',
    actorName: 'admin',
    reason: 'Updated address',
    entityType: 'customer',
    entityId: 42,
    entityLabelEn: 'Rahim Uddin',
    entityLabelBn: 'রহিম উদ্দিন',
    status: 'ACTIVE',
    customerId: 42,
    transactionDisplayId: null,
  },
  {
    id: 'customer-archive-99',
    eventType: 'CUSTOMER_ARCHIVED',
    occurredAt: '2026-06-24T09:00:00Z',
    actorName: 'admin',
    reason: 'Inactive account',
    entityType: 'customer',
    entityId: 99,
    entityLabelEn: 'Inactive Customer',
    entityLabelBn: 'নিষ্ক্রিয় গ্রাহক',
    status: 'archived',
    customerId: 99,
    transactionDisplayId: null,
  },
];

export function paginatedEditHistory(results: EditHistoryEvent[], count = results.length) {
  return {
    count,
    next: null,
    previous: null,
    results,
  };
}
