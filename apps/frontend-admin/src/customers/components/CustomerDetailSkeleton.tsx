'use client';

import { Skeleton } from '@razzak-machinaries/shared/ui';

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="customer-detail-skeleton">
      <Skeleton className="h-8 w-48" />
      <div className="flex items-center gap-4 rounded-lg border p-6">
        <Skeleton className="size-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export function CustomerListSkeleton() {
  return (
    <div className="space-y-4" data-testid="customer-list-skeleton">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
