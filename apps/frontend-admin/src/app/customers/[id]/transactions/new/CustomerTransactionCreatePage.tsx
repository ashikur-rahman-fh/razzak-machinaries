'use client';

import { adminCustomersApi } from '@razzak-machinaries/shared/api';
import { PageShell } from '@razzak-machinaries/shared/ui';
import { useParams, useSearchParams } from 'next/navigation';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, useAsyncData } from '@/customers/hooks';
import { TransactionCreateForm } from '@/transactions/components/TransactionCreateForm';

export function CustomerTransactionCreatePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const customerId = Number(params.id);
  const initialType = searchParams.get('type');
  const { logout, isLoggingOut } = useAdminAuth();

  const { state: customerState } = useAsyncData(async () => {
    if (!customerId) throw new Error('Invalid customer id');
    return adminCustomersApi.getCustomer(customerId);
  }, [customerId]);

  const customer = getAsyncData(customerState);

  return (
    <RequireAdminAuth>
      <PageShell
        header={
          <AdminNavbar
            activeRoute="customers"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        <TransactionCreateForm
          preselectedCustomerId={customerId}
          preselectedCustomer={customer}
          initialType={initialType}
          backHref={`/customers/${customerId}`}
        />
      </PageShell>
    </RequireAdminAuth>
  );
}
