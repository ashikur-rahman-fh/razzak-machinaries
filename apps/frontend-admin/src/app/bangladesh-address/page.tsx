import { Suspense } from 'react';

import { LoadingState } from '@razzak-machinaries/shared/ui';

import { BangladeshAddressPage } from './BangladeshAddressPage';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <BangladeshAddressPage />
    </Suspense>
  );
}
