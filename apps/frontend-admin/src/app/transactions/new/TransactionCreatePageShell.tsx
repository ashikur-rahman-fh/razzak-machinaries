'use client';

import { PageShell } from '@razzak-machinaries/shared/ui';
import { useSearchParams } from 'next/navigation';

import { AdminNavbar } from '@/components/AdminNavbar';
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
      <PageShell
        header={
          <AdminNavbar
            activeRoute="transactions"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        <TransactionCreatePage
          preselectedCustomerId={customerId && Number.isFinite(customerId) ? customerId : undefined}
          initialType={initialType}
        />
      </PageShell>
    </RequireAdminAuth>
  );
}
