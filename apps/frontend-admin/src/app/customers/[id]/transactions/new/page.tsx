import { Suspense } from 'react';

import { GearLoader } from '@razzak-machinaries/shared/ui';

import { CustomerTransactionCreatePage } from './CustomerTransactionCreatePage';

export default function Page() {
  return (
    <Suspense fallback={<GearLoader />}>
      <CustomerTransactionCreatePage />
    </Suspense>
  );
}
