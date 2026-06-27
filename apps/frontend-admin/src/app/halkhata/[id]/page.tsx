'use client';

import { Suspense } from 'react';

import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { HalkhataDetailPage } from './HalkhataDetailPage';

export default function Page() {
  return (
    <Suspense fallback={<CustomerListSkeleton />}>
      <HalkhataDetailPage />
    </Suspense>
  );
}
