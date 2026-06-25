import { Suspense } from 'react';

import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerDetailPage } from './CustomerDetailPage';

export default function CustomerDetailRoutePage() {
  return (
    <Suspense fallback={<CustomerDetailSkeleton />}>
      <CustomerDetailPage />
    </Suspense>
  );
}
