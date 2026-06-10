'use client';

import { adminAuthApi, getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorAlert,
  SuccessAlert,
  Input,
  PageShell,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';

function StatusBadge({
  labelKey,
  active,
  testId,
}: {
  labelKey: 'profile.staffStatus' | 'profile.superuserStatus';
  active: boolean;
  testId: string;
}) {
  const translationKey =
    labelKey === 'profile.staffStatus'
      ? active
        ? 'profile.staffYes'
        : 'profile.staffNo'
      : active
        ? 'profile.superuserYes'
        : 'profile.superuserNo';

  return (
    <Badge
      variant={active ? 'success' : 'outline'}
      className="items-start gap-0 px-2.5 py-1"
      data-testid={testId}
    >
      <TranslatedText translationKey={translationKey} as="span" layout="inline" />
    </Badge>
  );
}

export function AdminProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguagePreference();
  const { user, logout, isLoggingOut, refreshUser } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const errorId = useId();
  const successId = useId();

  function startEditing() {
    if (!user) {
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setError(null);
    setSuccessKey(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccessKey(null);
    try {
      await adminAuthApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setIsEditing(false);
      setSuccessKey('profile.saved');
    } catch (err) {
      if (isApiError(err) && err.isValidationError) {
        setError(t('profile.validation'));
      } else {
        setError(getUserFacingMessage(err, language));
      }
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = isEditing && email.trim().length > 0 && !isSaving;

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="admin-profile-page"
        header={
          <AdminNavbar
            activeRoute="profile"
            onLogout={() => void handleLogout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        {user ? (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>
                    <TranslatedText translationKey="profile.title" as="span" />
                  </CardTitle>
                  <CardDescription>
                    <TranslatedText translationKey="profile.subtitle" as="span" />
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                      <TranslatedText translationKey="profile.editProfile" as="span" compact />
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/change-password">
                        <TranslatedText translationKey="password.changePassword" as="span" compact />
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {successKey ? (
                  <SuccessAlert
                    id={successId}
                    title={<TranslatedText translationKey={successKey} as="span" />}
                    role="status"
                    aria-live="polite"
                    data-testid="admin-profile-success"
                  />
                ) : null}

                {isEditing ? (
                  <form
                    className="space-y-4"
                    onSubmit={(event) => void handleSave(event)}
                    noValidate
                  >
                    {error ? (
                      <ErrorAlert
                        id={errorId}
                        title={t('profile.saveFailed')}
                        description={error}
                        role="alert"
                        aria-live="polite"
                        data-testid="admin-profile-error"
                      />
                    ) : null}
                    <div className="space-y-2">
                      <label htmlFor={firstNameId} className="text-sm font-medium text-foreground">
                        {t('profile.firstName')}
                      </label>
                      <Input
                        id={firstNameId}
                        name="firstName"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={lastNameId} className="text-sm font-medium text-foreground">
                        {t('profile.lastName')}
                      </label>
                      <Input
                        id={lastNameId}
                        name="lastName"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={emailId} className="text-sm font-medium text-foreground">
                        {t('profile.email')}
                      </label>
                      <Input
                        id={emailId}
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={!canSave} aria-busy={isSaving}>
                        {isSaving ? (
                          <TranslatedText translationKey="profile.savingProfile" as="span" compact />
                        ) : (
                          <TranslatedText translationKey="profile.saveProfile" as="span" compact />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSaving}
                      >
                        <TranslatedText translationKey="profile.cancelEdit" as="span" compact />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <dl className="grid gap-3 text-sm">
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">{t('profile.name')}</dt>
                        <dd data-testid="admin-profile-name">{user.name}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">{t('profile.username')}</dt>
                        <dd data-testid="admin-profile-username">{user.username}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-medium text-muted-foreground">{t('profile.email')}</dt>
                        <dd data-testid="admin-profile-email">{user.email}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        labelKey="profile.staffStatus"
                        active={user.isStaff}
                        testId="admin-profile-staff-badge"
                      />
                      <StatusBadge
                        labelKey="profile.superuserStatus"
                        active={user.isSuperuser}
                        testId="admin-profile-superuser-badge"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </PageShell>
    </RequireAdminAuth>
  );
}
