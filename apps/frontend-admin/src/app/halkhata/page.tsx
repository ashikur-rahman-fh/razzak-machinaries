'use client';

import { Suspense } from 'react';

import { HalkhataListPage } from './HalkhataListPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HalkhataListPage />
    </Suspense>
  );
}
