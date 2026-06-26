'use client';

import { Skeleton } from '@razzak-machinaries/shared/ui';

export function TransactionDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="transaction-detail-skeleton">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg border p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
