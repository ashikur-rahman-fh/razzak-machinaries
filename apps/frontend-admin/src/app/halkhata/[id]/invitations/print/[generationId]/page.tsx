import { Suspense } from 'react';

import { InvitationPrintPage } from './InvitationPrintPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InvitationPrintPage />
    </Suspense>
  );
}
