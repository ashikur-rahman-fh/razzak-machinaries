import { Suspense } from 'react';

import { GearLoader } from '@razzak-machinaries/shared/ui';

import { TransactionCreatePageShell } from './TransactionCreatePageShell';

export default function Page() {
  return (
    <Suspense fallback={<GearLoader />}>
      <TransactionCreatePageShell />
    </Suspense>
  );
}
