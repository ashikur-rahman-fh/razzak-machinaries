import { Suspense } from 'react';
import { LoadingState } from '@razzak-machinaries/shared/ui';
import { StaffUsersListPage } from './StaffUsersListPage';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState layout="fullscreen" label="Loading staff users" />}>
      <StaffUsersListPage />
    </Suspense>
  );
}
