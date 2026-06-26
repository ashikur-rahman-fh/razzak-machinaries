'use client';

import { useSearchParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';

import { TransactionCreatePage } from './TransactionCreatePage';

export function TransactionCreatePageShell() {
  const searchParams = useSearchParams();
  const customerIdRaw = searchParams.get('customerId');
  const customerId = customerIdRaw ? Number(customerIdRaw) : undefined;
  const initialType = searchParams.get('type');
  const { logout, isLoggingOut } = useAdminAuth();

  return (
    <RequireAdminAuth>
      <AdminAppShell
        activeRoute="transactions"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <TransactionCreatePage
          preselectedCustomerId={customerId && Number.isFinite(customerId) ? customerId : undefined}
          initialType={initialType}
        />
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
