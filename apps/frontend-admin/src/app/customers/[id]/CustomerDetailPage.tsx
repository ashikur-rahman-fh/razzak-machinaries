'use client';

import { adminCustomersApi, isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  EmptyState,
  ErrorState,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { ArchiveConfirmationModal } from '@/customers/components/ArchiveConfirmationModal';
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerBalanceSummary } from '@/transactions/components/CustomerBalanceSummary';
import { CustomerTransactionsPanel } from '@/transactions/components/CustomerTransactionsPanel';
import { CustomerReadOnlyDetails } from '@/customers/components/CustomerReadOnlyDetails';
import { FEEDBACK_DISMISS_MS } from '@/customers/constants';
import { getCustomerArchiveErrorMessage } from '@/customers/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';
import { parseListState } from '@/customers/routes';
import { formatCustomerPhone } from '@/customers/utils';
import { CustomerFollowUpPanel } from '@/follow-ups/components/CustomerFollowUpPanel';

export function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const customerId = Number(params.id);
  const fromQuery = searchParams.get('from');
  const success = searchParams.get('success');
  const listState = fromQuery ? parseListState(new URLSearchParams(fromQuery)) : undefined;

  const [showArchive, setShowArchive] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [dismissedRedirectSuccess, setDismissedRedirectSuccess] = useState(false);
  const showRedirectSuccess =
    (success === 'updated' || success === 'transactionCreated') && !dismissedRedirectSuccess;

  const dismissRedirectSuccess = useCallback(() => {
    setDismissedRedirectSuccess(true);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('success');
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const { state: customerState, reload: reloadCustomer } = useAsyncData(async () => {
    if (!customerId) throw new Error('Invalid customer id');
    return adminCustomersApi.getCustomer(customerId);
  }, [customerId]);

  useEffect(() => {
    if (!showRedirectSuccess) return;
    const timer = window.setTimeout(() => dismissRedirectSuccess(), FEEDBACK_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismissRedirectSuccess, showRedirectSuccess]);

  const customer = getAsyncData(customerState);
  const isInitialLoad = isAsyncInitialLoad(customerState);

  async function handleArchive(archiveReason: string) {
    if (!customer || isArchiving) return;
    setIsArchiving(true);
    setArchiveError(null);
    try {
      await adminCustomersApi.archiveCustomer(customer.id, { archiveReason });
      await reloadCustomer();
      setShowArchive(false);
    } catch (err) {
      setArchiveError(getCustomerArchiveErrorMessage(err, language));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="customer-detail-page"
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        {showRedirectSuccess ? (
          <SuccessAlert
            title={
              <TranslatedText
                translationKey={
                  success === 'transactionCreated'
                    ? 'transaction.create.success'
                    : 'customer.detail.updated'
                }
                as="span"
                layout="inline"
              />
            }
            role="status"
            className="mb-6"
          />
        ) : null}

        {isInitialLoad ? <CustomerDetailSkeleton /> : null}

        {!isInitialLoad && customerState.status === 'error' ? (
          isApiError(customerState.error) && customerState.error.isNotFound ? (
            <EmptyState
              title={
                <TranslatedText
                  translationKey="customer.detail.notFound"
                  as="span"
                  layout="inline"
                />
              }
            />
          ) : (
            <div className="space-y-3">
              <ErrorState
                message={
                  <TranslatedText
                    translationKey="customer.detail.loadError"
                    as="span"
                    layout="inline"
                  />
                }
              />
              <button
                type="button"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => void reloadCustomer()}
              >
                <TranslatedText translationKey="customer.actions.retry" as="span" compact />
              </button>
            </div>
          )
        ) : null}

        {customer ? (
          <>
            <div className="mb-6 space-y-6">
              <CustomerBalanceSummary customerId={customer.id} />
              <CustomerFollowUpPanel customerId={customer.id} isArchived={customer.isArchived} />
              <CustomerTransactionsPanel customerId={customer.id} />
            </div>
            <CustomerReadOnlyDetails
              customer={customer}
              listState={listState}
              fromQuery={fromQuery}
              onArchive={() => {
                setArchiveError(null);
                setShowArchive(true);
              }}
            />
            <ArchiveConfirmationModal
              open={showArchive}
              onOpenChange={(open) => {
                if (!open && !isArchiving) {
                  setShowArchive(false);
                  setArchiveError(null);
                }
              }}
              customerNameBn={customer.fullNameBn}
              customerNameEn={customer.fullNameEn}
              phone={formatCustomerPhone(customer)}
              onConfirm={handleArchive}
              isLoading={isArchiving}
              errorMessage={archiveError}
            />
          </>
        ) : null}
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
