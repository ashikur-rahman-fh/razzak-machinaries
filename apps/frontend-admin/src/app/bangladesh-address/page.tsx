import { Suspense } from 'react';

import { LoadingState, TranslatedText } from '@razzak-machinaries/shared/ui';

import { BangladeshAddressPage } from './BangladeshAddressPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <LoadingState
          label={<TranslatedText translationKey="common.loading" as="span" compact />}
        />
      }
    >
      <BangladeshAddressPage />
    </Suspense>
  );
}
