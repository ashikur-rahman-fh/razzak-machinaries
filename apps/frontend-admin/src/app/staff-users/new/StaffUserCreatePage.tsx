'use client';

import { adminStaffUsersApi, isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth, RequireSuperuser } from '@/auth/guards';
import { StaffUserForm } from '@/staff/components/StaffUserForm';
import { TemporaryPasswordPanel } from '@/staff/components/TemporaryPasswordPanel';
import { getStaffErrorMessage } from '@/staff/errors';
import { buildListUrl } from '@/staff/routes';
import { hasStaffFormErrors, validateStaffForm, type StaffFormValues } from '@/staff/validation';

const INITIAL_VALUES: StaffFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  isActive: true,
  temporaryPassword: '',
};

export function StaffUserCreatePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const [values, setValues] = useState<StaffFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StaffFormValues, string>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  async function handleGeneratePassword() {
    setIsGeneratingPassword(true);
    setError(null);
    try {
      const response = await adminStaffUsersApi.generateTemporaryPassword();
      setValues((current) => ({ ...current, temporaryPassword: response.temporaryPassword }));
    } catch (err) {
      setError(getStaffErrorMessage(err, language));
    } finally {
      setIsGeneratingPassword(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateStaffForm(values, language);
    setFieldErrors(errors);
    if (hasStaffFormErrors(errors)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await adminStaffUsersApi.createStaffUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        username: values.username.trim(),
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        isActive: values.isActive,
        temporaryPassword: values.temporaryPassword.trim() || undefined,
      });
      if (response.temporaryPassword) {
        setCreatedPassword(response.temporaryPassword);
      } else {
        router.push(`${buildListUrl()}?success=created`);
      }
    } catch (err) {
      if (isApiError(err) && err.isValidationError && err.details) {
        const nextErrors = { ...fieldErrors };
        for (const [key, messages] of Object.entries(err.details)) {
          if (Array.isArray(messages) && messages[0]) {
            const formKey = key as keyof StaffFormValues;
            nextErrors[formKey] = messages[0];
          }
        }
        setFieldErrors(nextErrors);
      }
      setError(getStaffErrorMessage(err, language));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequireAdminAuth>
      <RequireSuperuser>
        <AdminAppShell
          data-testid="staff-user-create-page"
          activeRoute="staff-users"
          onLogout={() => void logout()}
          isLoggingOut={isLoggingOut}
        >
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <header className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                <TranslatedText translationKey="staff.create.title" as="span" />
              </h1>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="staff.create.subtitle" as="span" />
              </p>
            </header>

            <Card>
              <CardHeader>
                <CardTitle className="sr-only">
                  <TranslatedText translationKey="staff.create.title" as="span" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {createdPassword ? (
                  <div className="space-y-4">
                    <TemporaryPasswordPanel
                      password={createdPassword}
                      onDismiss={() => router.push(`${buildListUrl()}?success=created`)}
                    />
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
                    {error ? (
                      <ErrorAlert title={t('staff.error.createFailed')} description={error} />
                    ) : null}
                    <StaffUserForm
                      values={values}
                      errors={fieldErrors}
                      onChange={setValues}
                      onGeneratePassword={() => void handleGeneratePassword()}
                      isGeneratingPassword={isGeneratingPassword}
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                        <TranslatedText
                          translationKey={
                            isSubmitting ? 'staff.create.submitting' : 'staff.create.submit'
                          }
                          as="span"
                          compact
                        />
                      </Button>
                      <Button type="button" variant="ghost" asChild>
                        <Link href={buildListUrl()}>
                          <TranslatedText translationKey="staff.create.back" as="span" compact />
                        </Link>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminAppShell>
      </RequireSuperuser>
    </RequireAdminAuth>
  );
}
