import { Suspense } from 'react';

import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomersListPage } from './CustomersListPage';

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomerListSkeleton />}>
      <CustomersListPage />
    </Suspense>
  );
}
