'use client';

import type { FollowUpStatus } from '@razzak-machinaries/shared/api';
import { TranslatedText, cn } from '@razzak-machinaries/shared/ui';

const STATUS_KEYS: Record<FollowUpStatus, string> = {
  pending: 'followUp.status.pending',
  completed: 'followUp.status.completed',
  rescheduled: 'followUp.status.rescheduled',
  cancelled: 'followUp.status.cancelled',
};

const STATUS_STYLES: Record<FollowUpStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rescheduled: 'border-sky-200 bg-sky-50 text-sky-800',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-700',
};

type FollowUpStatusBadgeProps = {
  status: FollowUpStatus;
  className?: string;
};

export function FollowUpStatusBadge({ status, className }: FollowUpStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      <TranslatedText translationKey={STATUS_KEYS[status]} as="span" compact />
    </span>
  );
}
