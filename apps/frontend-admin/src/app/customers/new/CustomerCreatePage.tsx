'use client';

import { adminCustomersApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { TranslatedText } from '@razzak-machinaries/shared/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RequireAdminAuth } from '@/auth/guards';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { AdminAppShell } from '@/components/AdminAppShell';

import { FEEDBACK_DISMISS_MS } from '@/customers/constants';
import { CustomerCreateForm } from '@/customers/components/CustomerCreateForm';
import { getCustomerCreateErrorMessage } from '@/customers/errors';
import { buildCustomerFormData, type CustomerFormValues } from '@/customers/validation';

export function CustomerCreatePage() {
  const { language } = useLanguagePreference();
  const router = useRouter();
  const { logout, isLoggingOut } = useAdminAuth();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'created');
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timer = window.setTimeout(() => {
      setShowSuccess(false);
      router.replace('/customers/new');
    }, FEEDBACK_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [router, showSuccess]);

  async function handleSubmit(values: CustomerFormValues, profilePicture: File | null) {
    setServerError(null);
    try {
      const formData = buildCustomerFormData(values, profilePicture);
      await adminCustomersApi.createCustomer(formData);
      setFormKey((current) => current + 1);
      router.push('/customers?success=created');
      router.refresh();
    } catch (error) {
      setServerError(getCustomerCreateErrorMessage(error, language));
    }
  }

  return (
    <RequireAdminAuth>
      <AdminAppShell
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="space-y-6" data-testid="customer-create-page">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              <TranslatedText translationKey="customer.create.title" as="span" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="customer.create.subtitle" as="span" />
            </p>
          </header>

          <CustomerCreateForm
            key={formKey}
            onSubmit={handleSubmit}
            serverError={serverError}
            showSuccess={showSuccess}
          />
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
