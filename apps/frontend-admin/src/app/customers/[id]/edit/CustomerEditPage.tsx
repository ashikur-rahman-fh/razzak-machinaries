'use client';

import { adminCustomersApi, isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { EmptyState, ErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerCreateForm } from '@/customers/components/CustomerCreateForm';
import { CustomerDetailSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { getCustomerUpdateErrorMessage } from '@/customers/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';
import { buildDetailUrl, parseListState } from '@/customers/routes';
import {
  buildCustomerFormData,
  customerToFormValues,
  type CustomerFormValues,
} from '@/customers/validation';
import { useState } from 'react';

export function CustomerEditPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const customerId = Number(params.id);
  const fromQuery = searchParams.get('from');
  const listState = fromQuery ? parseListState(new URLSearchParams(fromQuery)) : undefined;
  const detailHref = buildDetailUrl(customerId, listState);

  const [serverError, setServerError] = useState<string | null>(null);

  const { state: customerState, reload: reloadCustomer } = useAsyncData(async () => {
    if (!customerId) throw new Error('Invalid customer id');
    return adminCustomersApi.getCustomer(customerId);
  }, [customerId]);

  const customer = getAsyncData(customerState);
  const isInitialLoad = isAsyncInitialLoad(customerState);

  async function handleSubmit(
    values: CustomerFormValues,
    profilePicture: File | null,
    changeReason?: string,
  ) {
    if (!customer) return;
    setServerError(null);
    try {
      const formData = buildCustomerFormData(values, profilePicture, changeReason);
      await adminCustomersApi.createCustomerVersion(customer.id, formData);
      const separator = detailHref.includes('?') ? '&' : '?';
      router.push(`${detailHref}${separator}success=updated`);
    } catch (error) {
      setServerError(getCustomerUpdateErrorMessage(error, language));
    }
  }

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="customer-edit-page"
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <Link
              href={detailHref}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              <TranslatedText translationKey="customer.detail.back" as="span" compact />
            </Link>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              <TranslatedText translationKey="customer.edit.title" as="span" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="customer.edit.subtitle" as="span" />
            </p>
          </div>

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
            <CustomerCreateForm
              mode="edit"
              initialValues={customerToFormValues(customer)}
              initialProfilePictureUrl={customer.profilePictureUrl}
              onSubmit={handleSubmit}
              serverError={serverError}
            />
          ) : null}
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
