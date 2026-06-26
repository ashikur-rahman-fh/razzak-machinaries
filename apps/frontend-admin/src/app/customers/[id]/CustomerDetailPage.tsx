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
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerBalanceSummary } from '@/transactions/components/CustomerBalanceSummary';
import { CustomerTransactionsPanel } from '@/transactions/components/CustomerTransactionsPanel';
import { CustomerReadOnlyDetails } from '@/customers/components/CustomerReadOnlyDetails';
import { DeleteConfirmationModal } from '@/customers/components/DeleteConfirmationModal';
import { FEEDBACK_DISMISS_MS } from '@/customers/constants';
import { getCustomerDeleteErrorMessage } from '@/customers/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';
import { getBackListUrl, parseListState } from '@/customers/routes';
import { formatCustomerPhone } from '@/customers/utils';

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
  const backHref = getBackListUrl(fromQuery);
  const listState = fromQuery ? parseListState(new URLSearchParams(fromQuery)) : undefined;

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  async function handleDelete() {
    if (!customer || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminCustomersApi.deleteCustomer(customer.id);
      router.push(`${backHref}${backHref.includes('?') ? '&' : '?'}success=deleted`);
    } catch (err) {
      setDeleteError(getCustomerDeleteErrorMessage(err, language));
    } finally {
      setIsDeleting(false);
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
              <CustomerTransactionsPanel customerId={customer.id} />
            </div>
            <CustomerReadOnlyDetails
              customer={customer}
              listState={listState}
              fromQuery={fromQuery}
              onDelete={() => {
                setDeleteError(null);
                setShowDelete(true);
              }}
            />
            <DeleteConfirmationModal
              open={showDelete}
              onOpenChange={(open) => {
                if (!open && !isDeleting) {
                  setShowDelete(false);
                  setDeleteError(null);
                }
              }}
              customerNameBn={customer.fullNameBn}
              customerNameEn={customer.fullNameEn}
              phone={formatCustomerPhone(customer)}
              onConfirm={handleDelete}
              isLoading={isDeleting}
              errorMessage={deleteError}
            />
          </>
        ) : null}
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
