'use client';

import { adminCustomersApi } from '@razzak-machinaries/shared/api';
import {
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { buildDetailUrl } from '@/customers/routes';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

export function CustomerHistoryPage() {
  const params = useParams<{ id: string }>();
  const { logout, isLoggingOut } = useAdminAuth();
  const customerId = Number(params.id);

  const { state } = useAsyncData(async () => {
    if (!customerId) throw new Error('Invalid customer id');
    return adminCustomersApi.getCustomerHistory(customerId);
  }, [customerId]);

  const history = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="customer-history-page"
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <Link
              href={buildDetailUrl(customerId)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              <TranslatedText translationKey="customer.history.back" as="span" compact />
            </Link>
            <h1 className="text-2xl font-semibold">
              <TranslatedText translationKey="customer.history.title" as="span" />
            </h1>
          </div>

          {isInitialLoad ? <CustomerDetailSkeleton /> : null}

          {!isInitialLoad && state.status === 'error' ? (
            <ErrorState
              message={
                <TranslatedText
                  translationKey="customer.history.loadError"
                  as="span"
                  layout="inline"
                />
              }
            />
          ) : null}

          {history?.versions.map((version) => (
            <Card key={version.id}>
              <CardContent className="space-y-2 p-6">
                <p className="text-lg font-semibold">
                  <TranslatedText translationKey="customer.history.version" as="span" compact />{' '}
                  {version.versionNumber}
                  {version.isCurrent ? (
                    <span className="ml-2 text-sm font-medium text-emerald-700">
                      (
                      <TranslatedText
                        translationKey="transaction.status.active"
                        as="span"
                        compact
                      />
                      )
                    </span>
                  ) : null}
                </p>
                <p className="font-bangla text-base">{version.fullNameBn}</p>
                <p className="text-muted-foreground">{version.fullNameEn}</p>
                {version.changeReason ? (
                  <p className="text-sm text-muted-foreground">{version.changeReason}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}

          {history && history.versions.length === 0 ? (
            <EmptyState
              title={
                <TranslatedText translationKey="customer.history.empty" as="span" layout="inline" />
              }
            />
          ) : null}
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
