'use client';

import type { EditHistoryEvent, EditHistoryEventType } from '@razzak-machinaries/shared/api';
import { cn, TranslatedText } from '@razzak-machinaries/shared/ui';

const EVENT_LABEL_KEYS: Record<EditHistoryEventType, string> = {
  TRANSACTION_CORRECTED: 'editHistory.event.transactionCorrected',
  TRANSACTION_VOIDED: 'editHistory.event.transactionVoided',
  CUSTOMER_EDITED: 'editHistory.event.customerEdited',
  CUSTOMER_ARCHIVED: 'editHistory.event.customerArchived',
};

const EVENT_STYLES: Record<EditHistoryEventType, string> = {
  TRANSACTION_CORRECTED: 'bg-amber-100 text-amber-900',
  TRANSACTION_VOIDED: 'bg-rose-100 text-rose-900',
  CUSTOMER_EDITED: 'bg-sky-100 text-sky-900',
  CUSTOMER_ARCHIVED: 'bg-slate-200 text-slate-800',
};

type EditHistoryEventBadgeProps = {
  eventType: EditHistoryEventType;
  className?: string;
};

export function EditHistoryEventBadge({ eventType, className }: EditHistoryEventBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        EVENT_STYLES[eventType],
        className,
      )}
    >
      <TranslatedText translationKey={EVENT_LABEL_KEYS[eventType]} as="span" compact />
    </span>
  );
}

export function getEventLabelKey(event: EditHistoryEvent): string {
  return EVENT_LABEL_KEYS[event.eventType];
}
