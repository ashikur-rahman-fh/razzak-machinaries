'use client';

import { adminAuthApi, isApiError } from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  ErrorAlert,
  SuccessAlert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageShell,
  PasswordInput,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { AdminNavbar } from '@/components/AdminNavbar';
import { RequireAdminAuth } from '@/auth/guards';

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const currentId = useId();
  const newId = useId();
  const confirmId = useId();
  const errorId = useId();

  const trimmedMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !trimmedMismatch &&
    !isSaving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      if (trimmedMismatch) {
        setError(t('password.mismatch'));
      }
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccessKey(null);
    try {
      await adminAuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessKey('password.updated');
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          setError(t('password.currentPasswordWrong'));
        } else if (err.code === 'WEAK_PASSWORD') {
          setError(t('password.weakPassword'));
        } else if (err.isValidationError) {
          setError(t('password.validation'));
        } else {
          setError(t('password.validation'));
        }
      } else {
        setError(t('password.validation'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="admin-change-password-page"
        header={<AdminNavbar activeRoute="change-password" />}
        contentClassName="flex flex-1 items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle>
              <TranslatedText translationKey="password.title" as="span" />
            </CardTitle>
            <CardDescription>
              <TranslatedText translationKey="password.subtitle" as="span" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
              {error ? (
                <ErrorAlert
                  id={errorId}
                  title={t('password.updateFailed')}
                  description={error}
                  role="alert"
                  aria-live="polite"
                  data-testid="admin-change-password-error"
                />
              ) : null}
              {successKey ? (
                <SuccessAlert
                  title={<TranslatedText translationKey={successKey} as="span" />}
                  role="status"
                  aria-live="polite"
                  data-testid="admin-change-password-success"
                />
              ) : null}

              <PasswordInput
                id={currentId}
                name="currentPassword"
                label={t('password.currentPasswordLabel')}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isSaving}
                required
                showPasswordLabel={t('profile.showPassword')}
                hidePasswordLabel={t('profile.hidePassword')}
              />

              <PasswordInput
                id={newId}
                name="newPassword"
                label={t('password.newPasswordLabel')}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isSaving}
                required
                showPasswordLabel={t('profile.showPassword')}
                hidePasswordLabel={t('profile.hidePassword')}
              />

              <PasswordInput
                id={confirmId}
                name="confirmPassword"
                label={t('password.confirmPasswordLabel')}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={isSaving}
                required
                showPasswordLabel={t('profile.showPassword')}
                hidePasswordLabel={t('profile.hidePassword')}
              />

              {trimmedMismatch ? (
                <ErrorAlert title={t('password.mismatch')} role="alert" aria-live="polite" />
              ) : null}

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={!canSubmit} aria-busy={isSaving}>
                  {isSaving ? (
                    <TranslatedText translationKey="password.updatingPassword" as="span" compact />
                  ) : (
                    <TranslatedText translationKey="password.updatePassword" as="span" compact />
                  )}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/">
                    <TranslatedText translationKey="password.backToProfile" as="span" compact />
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageShell>
    </RequireAdminAuth>
  );
}
