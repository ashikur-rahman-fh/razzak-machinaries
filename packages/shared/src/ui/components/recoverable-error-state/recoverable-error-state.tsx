import * as React from 'react';

import { Button } from '../button';
import { ErrorState } from '../error-state';
import { cn } from '../../utils/cn';

export type RecoverableErrorStateProps = {
  message: React.ReactNode;
  className?: string;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  backHref?: string;
  backLabel?: React.ReactNode;
};

export function RecoverableErrorState({
  message,
  className,
  onRetry,
  retryLabel,
  backHref,
  backLabel,
}: RecoverableErrorStateProps) {
  const hasActions = Boolean(onRetry || (backHref && backLabel));

  return (
    <div className={cn('space-y-3', className)}>
      <ErrorState message={message} />
      {hasActions ? (
        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {backHref && backLabel ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={backHref}>{backLabel}</a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
