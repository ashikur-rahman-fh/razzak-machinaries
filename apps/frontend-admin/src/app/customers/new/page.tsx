import { Suspense } from 'react';

import { LoadingState, TranslatedText } from '@razzak-machinaries/shared/ui';

import { CustomerCreatePage } from './CustomerCreatePage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <LoadingState
          label={<TranslatedText translationKey="common.loading" as="span" compact />}
        />
      }
    >
      <CustomerCreatePage />
    </Suspense>
  );
}
