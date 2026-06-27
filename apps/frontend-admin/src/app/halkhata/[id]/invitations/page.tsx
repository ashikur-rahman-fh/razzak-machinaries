import { Suspense } from 'react';

import { PreHalkhataInvitationPage } from './PreHalkhataInvitationPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PreHalkhataInvitationPage />
    </Suspense>
  );
}
