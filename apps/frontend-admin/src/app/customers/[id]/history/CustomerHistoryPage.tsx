'use client';

import { adminCustomersApi, type CustomerVersion } from '@razzak-machinaries/shared/api';
import { EmptyState, ErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerVersionHistoryCard } from '@/customers/components/CustomerVersionHistoryCard';
import { buildDetailUrl } from '@/customers/routes';
import { findPreviousCustomerVersion } from '@/customers/version-diff';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

export function CustomerHistoryPage() {
  const params = useParams<{ id: string }>();
  const { logout, isLoggingOut } = useAdminAuth();
  const customerId = Number(params.id);
  const isValidId = Number.isFinite(customerId) && customerId > 0;

  const { state, reload } = useAsyncData(async () => {
    if (!isValidId) throw new Error('Invalid customer id');
    return adminCustomersApi.getCustomerHistory(customerId);
  }, [customerId, isValidId]);

  const history = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  const versionsById = useMemo(() => {
    if (!history) return new Map<number, CustomerVersion>();
    return new Map(history.versions.map((version) => [version.id, version]));
  }, [history]);

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
            <div className="space-y-3">
              <ErrorState
                message={
                  <TranslatedText
                    translationKey="customer.history.loadError"
                    as="span"
                    layout="inline"
                  />
                }
              />
              <button
                type="button"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => void reload()}
              >
                <TranslatedText translationKey="customer.actions.retry" as="span" compact />
              </button>
            </div>
          ) : null}

          {history && history.versions.length === 0 ? (
            <EmptyState
              title={
                <TranslatedText translationKey="customer.history.empty" as="span" layout="inline" />
              }
            />
          ) : null}

          {history?.versions.map((version) => (
            <CustomerVersionHistoryCard
              key={version.id}
              customerId={customerId}
              version={version}
              previousVersion={
                version.previousVersionId != null
                  ? (versionsById.get(version.previousVersionId) ??
                    findPreviousCustomerVersion(history.versions, version))
                  : undefined
              }
            />
          ))}
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
