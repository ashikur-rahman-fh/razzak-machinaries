import type { Transaction, TransactionItem } from '@razzak-machinaries/shared/api';

import type { FieldChange } from '@/components/version-change-types';

function formatItemsSummary(items: TransactionItem[]): string {
  if (items.length === 0) {
    return '—';
  }

  return items
    .map((item) => `${item.productName} × ${item.quantity} @ ${item.unitPrice}`)
    .join('; ');
}

function formatPaymentMethod(paymentMethod: string): string {
  return paymentMethod || '—';
}

export function getTransactionVersionChanges(
  previous: Transaction,
  current: Transaction,
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (previous.date !== current.date) {
    changes.push({
      labelKey: 'transaction.create.date',
      from: previous.date,
      to: current.date,
    });
  }

  if (previous.transactionType !== current.transactionType) {
    changes.push({
      labelKey: 'transaction.list.column.type',
      from: previous.transactionType,
      to: current.transactionType,
    });
  }

  if (previous.totalAmount !== current.totalAmount) {
    changes.push({
      labelKey: 'transaction.total',
      from: previous.totalAmount,
      to: current.totalAmount,
    });
  }

  if ((previous.note || '').trim() !== (current.note || '').trim()) {
    changes.push({
      labelKey: 'transaction.create.note',
      from: previous.note || '—',
      to: current.note || '—',
    });
  }

  if (formatPaymentMethod(previous.paymentMethod) !== formatPaymentMethod(current.paymentMethod)) {
    changes.push({
      labelKey: 'transaction.create.paymentMethod',
      from: formatPaymentMethod(previous.paymentMethod),
      to: formatPaymentMethod(current.paymentMethod),
    });
  }

  const previousItemsSummary = formatItemsSummary(previous.items);
  const currentItemsSummary = formatItemsSummary(current.items);
  if (previousItemsSummary !== currentItemsSummary) {
    changes.push({
      labelKey: 'transaction.history.changes.items',
      from: previousItemsSummary,
      to: currentItemsSummary,
    });
  }

  return changes;
}

export function findTransactionById(
  versions: Transaction[],
  transactionId: number,
): Transaction | undefined {
  return versions.find((version) => version.id === transactionId);
}
