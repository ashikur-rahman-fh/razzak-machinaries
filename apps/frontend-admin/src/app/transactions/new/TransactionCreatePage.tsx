'use client';

import type { TransactionCreatePageProps } from './types';
import { TransactionCreateForm } from '@/transactions/components/TransactionCreateForm';

export function TransactionCreatePage({
  preselectedCustomerId,
  initialType = null,
}: TransactionCreatePageProps) {
  return (
    <TransactionCreateForm
      preselectedCustomerId={preselectedCustomerId}
      initialType={initialType}
      backHref={preselectedCustomerId ? `/customers/${preselectedCustomerId}` : '/transactions'}
    />
  );
}

export type { TransactionCreatePageProps };
