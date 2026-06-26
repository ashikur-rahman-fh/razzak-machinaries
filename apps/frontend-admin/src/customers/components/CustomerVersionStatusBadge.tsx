'use client';

import { TranslatedText } from '@razzak-machinaries/shared/ui';

type CustomerVersionStatusBadgeProps = {
  isCurrent: boolean;
};

export function CustomerVersionStatusBadge({ isCurrent }: CustomerVersionStatusBadgeProps) {
  const className = isCurrent
    ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'
    : 'inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground';

  return (
    <span className={className}>
      <TranslatedText
        translationKey={isCurrent ? 'customer.history.current' : 'customer.history.previous'}
        as="span"
        compact
      />
    </span>
  );
}
