'use client';

import { adminStaffUsersApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  ErrorState,
  LoadingState,
  RecoverableErrorState,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth, RequireSuperuser } from '@/auth/guards';
import { DeactivateStaffConfirmDialog } from '@/staff/components/DeactivateStaffConfirmDialog';
import { StaffUserForm } from '@/staff/components/StaffUserForm';
import { StaffUserRoleBadge } from '@/staff/components/StaffUserRoleBadge';
import { StaffUserStatusBadge } from '@/staff/components/StaffUserStatusBadge';
import { TemporaryPasswordPanel } from '@/staff/components/TemporaryPasswordPanel';
import { getStaffErrorMessage } from '@/staff/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/staff/hooks';
import { getBackListUrl } from '@/staff/routes';
import { hasStaffFormErrors, validateStaffForm, type StaffFormValues } from '@/staff/validation';

export function StaffUserDetailPage() {
  const params = useParams<{ id: string }>();
  const staffId = Number(params.id);
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const backHref = getBackListUrl(searchParams.get('from'));

  const { state: detailState, reload } = useAsyncData(
    () => adminStaffUsersApi.getStaffUser(staffId),
    [staffId],
  );
  const staffUser = getAsyncData(detailState);

  const initialValues = useMemo<StaffFormValues | null>(() => {
    if (!staffUser) return null;
    return {
      firstName: staffUser.firstName,
      lastName: staffUser.lastName,
      username: staffUser.username,
      email: staffUser.email,
      phone: staffUser.phone,
      isActive: staffUser.isActive,
      temporaryPassword: '',
    };
  }, [staffUser]);

  const [values, setValues] = useState<StaffFormValues | null>(null);
  const effectiveValues = values ?? initialValues;

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StaffFormValues, string>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveValues) return;

    const errors = validateStaffForm(effectiveValues, language);
    setFieldErrors(errors);
    if (hasStaffFormErrors(errors)) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await adminStaffUsersApi.updateStaffUser(staffId, {
        firstName: effectiveValues.firstName.trim(),
        lastName: effectiveValues.lastName.trim(),
        email: effectiveValues.email.trim() || undefined,
        phone: effectiveValues.phone.trim() || undefined,
        isActive: effectiveValues.isActive,
      });
      setSuccess(true);
      await reload();
    } catch (err) {
      setError(getStaffErrorMessage(err, language));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPassword() {
    setIsResettingPassword(true);
    setError(null);
    try {
      const response = await adminStaffUsersApi.resetTemporaryPassword(staffId);
      setResetPassword(response.temporaryPassword);
    } catch (err) {
      setError(getStaffErrorMessage(err, language));
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleDeactivate() {
    setIsDeactivating(true);
    setError(null);
    try {
      await adminStaffUsersApi.updateStaffUser(staffId, { isActive: false });
      setDeactivateOpen(false);
      setSuccess(true);
      await reload();
    } catch (err) {
      setError(getStaffErrorMessage(err, language));
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <RequireAdminAuth>
      <RequireSuperuser>
        <AdminAppShell
          data-testid="staff-user-detail-page"
          activeRoute="staff-users"
          onLogout={() => void logout()}
          isLoggingOut={isLoggingOut}
        >
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <header className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                <TranslatedText translationKey="staff.detail.title" as="span" />
              </h1>
              {staffUser ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <StaffUserRoleBadge isSuperuser={staffUser.isSuperuser} />
                  <StaffUserStatusBadge isActive={staffUser.isActive} />
                </div>
              ) : null}
            </header>

            {isAsyncInitialLoad(detailState) ? (
              <LoadingState label={t('staff.detail.title')} />
            ) : detailState.status === 'error' ? (
              <RecoverableErrorState
                message={getStaffErrorMessage(detailState.error, language)}
                onRetry={() => void reload()}
                retryLabel={language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
              />
            ) : !Number.isFinite(staffId) ? (
              <ErrorState message={t('staff.error.loadFailed')} />
            ) : staffUser && effectiveValues ? (
              <Card>
                <CardHeader>
                  <CardTitle>{staffUser.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error ? (
                    <ErrorAlert title={t('staff.error.saveFailed')} description={error} />
                  ) : null}
                  {success ? (
                    <SuccessAlert
                      title={<TranslatedText translationKey="staff.detail.saved" as="span" />}
                      role="status"
                    />
                  ) : null}

                  {resetPassword ? (
                    <TemporaryPasswordPanel
                      password={resetPassword}
                      onDismiss={() => setResetPassword(null)}
                    />
                  ) : null}

                  <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
                    <StaffUserForm
                      values={effectiveValues}
                      errors={fieldErrors}
                      onChange={setValues}
                      showPasswordField={false}
                      usernameReadOnly
                      disabled={isSaving}
                    />

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      {staffUser.createdByName ? (
                        <p>
                          <TranslatedText
                            translationKey="staff.detail.createdBy"
                            as="span"
                            compact
                          />
                          {': '}
                          {staffUser.createdByName}
                        </p>
                      ) : null}
                      {staffUser.updatedByName ? (
                        <p>
                          <TranslatedText
                            translationKey="staff.detail.updatedBy"
                            as="span"
                            compact
                          />
                          {': '}
                          {staffUser.updatedByName}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                        <TranslatedText
                          translationKey={isSaving ? 'staff.detail.saving' : 'staff.detail.save'}
                          as="span"
                          compact
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleResetPassword()}
                        disabled={isResettingPassword}
                        aria-busy={isResettingPassword}
                      >
                        <TranslatedText
                          translationKey={
                            isResettingPassword
                              ? 'staff.detail.resettingPassword'
                              : 'staff.detail.resetPassword'
                          }
                          as="span"
                          compact
                        />
                      </Button>
                      {staffUser.isActive ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setDeactivateOpen(true)}
                        >
                          <TranslatedText
                            translationKey="staff.detail.deactivate"
                            as="span"
                            compact
                          />
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" asChild>
                        <Link href={backHref}>
                          <TranslatedText translationKey="staff.detail.back" as="span" compact />
                        </Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            <DeactivateStaffConfirmDialog
              open={deactivateOpen}
              onOpenChange={setDeactivateOpen}
              staffName={staffUser?.name ?? ''}
              onConfirm={() => void handleDeactivate()}
              isLoading={isDeactivating}
            />
          </div>
        </AdminAppShell>
      </RequireSuperuser>
    </RequireAdminAuth>
  );
}
