'use client';

import { adminCustomersApi } from '@razzak-machinaries/shared/api';
import { EmptyState, ErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerVersionReadOnlyDetails } from '@/customers/components/CustomerVersionReadOnlyDetails';
import { buildCustomerHistoryUrl } from '@/customers/routes';
import { findCustomerVersionById, findPreviousCustomerVersion } from '@/customers/version-diff';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

export function CustomerVersionDetailPage() {
  const params = useParams<{ id: string; versionId: string }>();
  const { logout, isLoggingOut } = useAdminAuth();
  const customerId = Number(params.id);
  const versionId = Number(params.versionId);
  const isValidId = Number.isFinite(customerId) && customerId > 0;
  const isValidVersionId = Number.isFinite(versionId) && versionId > 0;

  const { state, reload } = useAsyncData(async () => {
    if (!isValidId || !isValidVersionId) throw new Error('Invalid customer version id');
    return adminCustomersApi.getCustomerHistory(customerId);
  }, [customerId, isValidId, isValidVersionId, versionId]);

  const history = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);
  const version = history ? findCustomerVersionById(history.versions, versionId) : undefined;
  const previousVersion =
    history && version ? findPreviousCustomerVersion(history.versions, version) : undefined;

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="customer-version-detail-page"
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
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

        {!isInitialLoad && state.status === 'success' && !version ? (
          <EmptyState
            title={
              <TranslatedText
                translationKey="customer.history.versionNotFound"
                as="span"
                layout="inline"
              />
            }
            action={
              <Link
                href={buildCustomerHistoryUrl(customerId)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <TranslatedText translationKey="customer.history.back" as="span" compact />
              </Link>
            }
          />
        ) : null}

        {version ? (
          <CustomerVersionReadOnlyDetails
            customerId={customerId}
            version={version}
            previousVersion={previousVersion}
          />
        ) : null}
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
