import { Suspense } from 'react';

import { GearLoader } from '@razzak-machinaries/shared/ui';

import { TransactionsListPage } from './TransactionsListPage';

export default function Page() {
  return (
    <Suspense fallback={<GearLoader />}>
      <TransactionsListPage />
    </Suspense>
  );
}
