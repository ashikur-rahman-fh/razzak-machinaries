import { Suspense } from 'react';

import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerEditPage } from './CustomerEditPage';

export default function CustomerEditRoutePage() {
  return (
    <Suspense fallback={<CustomerDetailSkeleton />}>
      <CustomerEditPage />
    </Suspense>
  );
}
