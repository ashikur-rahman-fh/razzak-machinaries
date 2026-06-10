'use client';

import { Card, CardContent, CardHeader, Skeleton } from '@razzak-machinaries/shared/ui';

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BangladeshAddressDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" data-testid="geo-detail-skeleton">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <CardSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full max-w-xs" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </CardContent>
      </Card>
    </div>
  );
}
