'use client';

import type { TransactionStatus } from '@razzak-machinaries/shared/api';
import { TranslatedText } from '@razzak-machinaries/shared/ui';

const STATUS_KEYS: Record<TransactionStatus, string> = {
  ACTIVE: 'transaction.status.active',
  SUPERSEDED: 'transaction.status.superseded',
  VOIDED: 'transaction.status.voided',
};

const STATUS_CLASSES: Record<TransactionStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  SUPERSEDED: 'bg-amber-100 text-amber-900',
  VOIDED: 'bg-rose-100 text-rose-800',
};

type TransactionStatusBadgeProps = {
  status: TransactionStatus;
};

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      <TranslatedText translationKey={STATUS_KEYS[status]} as="span" compact />
    </span>
  );
}
