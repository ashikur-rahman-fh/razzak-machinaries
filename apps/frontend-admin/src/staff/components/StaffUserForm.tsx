'use client';

import { Button, Input, PasswordInput, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import type { StaffFormErrors, StaffFormValues } from '@/staff/validation';

type StaffUserFormProps = {
  values: StaffFormValues;
  errors: StaffFormErrors;
  onChange: (values: StaffFormValues) => void;
  onGeneratePassword?: () => void;
  isGeneratingPassword?: boolean;
  showPasswordField?: boolean;
  showActiveToggle?: boolean;
  usernameReadOnly?: boolean;
  disabled?: boolean;
};

export function StaffUserForm({
  values,
  errors,
  onChange,
  onGeneratePassword,
  isGeneratingPassword = false,
  showPasswordField = true,
  showActiveToggle = true,
  usernameReadOnly = false,
  disabled = false,
}: StaffUserFormProps) {
  const { t } = useTranslation();

  function updateField<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="staff-first-name" className="text-sm font-medium">
            <TranslatedText translationKey="staff.form.firstName" as="span" compact />
          </label>
          <Input
            id="staff-first-name"
            value={values.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.firstName}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="staff-last-name" className="text-sm font-medium">
            <TranslatedText translationKey="staff.form.lastName" as="span" compact />
          </label>
          <Input
            id="staff-last-name"
            value={values.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(errors.lastName)}
          />
          {errors.lastName ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.lastName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="staff-username" className="text-sm font-medium">
          <TranslatedText translationKey="staff.form.username" as="span" compact />
        </label>
        <Input
          id="staff-username"
          value={values.username}
          onChange={(event) => updateField('username', event.target.value)}
          disabled={disabled || usernameReadOnly}
          readOnly={usernameReadOnly}
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
        />
        {errors.username ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.username}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="staff-email" className="text-sm font-medium">
            <TranslatedText translationKey="staff.form.email" as="span" compact />
          </label>
          <Input
            id="staff-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            disabled={disabled}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="staff-phone" className="text-sm font-medium">
            <TranslatedText translationKey="staff.form.phone" as="span" compact />
          </label>
          <Input
            id="staff-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            disabled={disabled}
            autoComplete="tel"
          />
        </div>
      </div>

      {showActiveToggle ? (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <label htmlFor="staff-active" className="text-sm font-medium">
              <TranslatedText translationKey="staff.form.active" as="span" compact />
            </label>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="staff.form.activeHint" as="span" />
            </p>
          </div>
          <input
            id="staff-active"
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
            disabled={disabled}
            className="size-4 rounded border-input"
          />
        </div>
      ) : null}

      {showPasswordField ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="staff-temp-password" className="text-sm font-medium">
              <TranslatedText translationKey="staff.form.temporaryPassword" as="span" compact />
            </label>
            {onGeneratePassword ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGeneratePassword}
                disabled={disabled || isGeneratingPassword}
                aria-busy={isGeneratingPassword}
              >
                <TranslatedText
                  translationKey={
                    isGeneratingPassword
                      ? 'staff.form.generatingPassword'
                      : 'staff.form.generatePassword'
                  }
                  as="span"
                  compact
                />
              </Button>
            ) : null}
          </div>
          <PasswordInput
            id="staff-temp-password"
            name="temporaryPassword"
            label={
              <TranslatedText translationKey="staff.form.temporaryPassword" as="span" compact />
            }
            value={values.temporaryPassword}
            onChange={(event) => updateField('temporaryPassword', event.target.value)}
            disabled={disabled}
            autoComplete="new-password"
            showPasswordLabel={t('staff.form.showPassword')}
            hidePasswordLabel={t('staff.form.hidePassword')}
          />
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="staff.form.temporaryPasswordHint" as="span" />
          </p>
        </div>
      ) : null}
    </div>
  );
}
