import { Suspense } from 'react';

import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';

import { EditHistoryPage } from './EditHistoryPage';

export default function Page() {
  return (
    <Suspense fallback={<CustomerListSkeleton />}>
      <EditHistoryPage />
    </Suspense>
  );
}
