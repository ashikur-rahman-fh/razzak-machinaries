'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  BilingualTranslatableField,
  BilingualTransliterationField,
  Button,
  ErrorAlert,
  ProfileImagePicker,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useState, type FormEvent } from 'react';

import {
  EMPTY_CUSTOMER_FORM,
  trimCustomerFormValues,
  validateCustomerForm,
  type CustomerFormValues,
} from '../validation';
import { CustomerFormSection } from './CustomerFormSection';

type CustomerCreateFormProps = {
  mode?: 'create' | 'edit';
  initialValues?: CustomerFormValues;
  initialProfilePictureUrl?: string | null;
  onSubmit: (values: CustomerFormValues, profilePicture: File | null) => Promise<void>;
  serverError?: string | null;
  showSuccess?: boolean;
};

export function CustomerCreateForm({
  mode = 'create',
  initialValues,
  initialProfilePictureUrl = null,
  onSubmit,
  serverError,
  showSuccess = false,
}: CustomerCreateFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<CustomerFormValues>(initialValues ?? EMPTY_CUSTOMER_FORM);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = mode === 'edit';

  const translationStatusLabels = {
    translating: t('customer.translation.translating'),
    auto: t('customer.translation.auto'),
    manual: t('customer.translation.manual'),
    failed: t('customer.translation.failed'),
  };

  const transliterationStatusLabels = {
    auto: t('customer.transliteration.auto'),
    manual: t('customer.transliteration.manual'),
  };

  const profileLabels = {
    section: t('customer.section.profilePicture'),
    upload: t('customer.profile.upload'),
    capture: t('customer.profile.capture'),
    remove: t('customer.profile.remove'),
    replace: t('customer.profile.replace'),
    capturePhoto: t('customer.profile.capturePhoto'),
    cancel: t('customer.profile.cancel'),
    cameraUnavailable: t('customer.profile.cameraUnavailable'),
    invalidType: t('customer.profile.invalidType'),
  };

  function updateField<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = trimCustomerFormValues(values);
    const errors = validateCustomerForm(trimmed);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, profilePicture);
    } finally {
      setIsSubmitting(false);
    }
  }

  const successKey = isEdit ? 'customer.edit.success' : 'customer.create.success';
  const submitKey = isEdit
    ? isSubmitting
      ? 'customer.edit.saving'
      : 'customer.edit.submit'
    : isSubmitting
      ? 'customer.create.creating'
      : 'customer.create.submit';

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      className="mx-auto w-full max-w-2xl space-y-6"
      data-testid={isEdit ? 'customer-edit-form' : 'customer-create-form'}
    >
      {showSuccess ? (
        <SuccessAlert
          title={<TranslatedText translationKey={successKey} as="span" layout="inline" />}
          role="status"
          aria-live="polite"
          data-testid={isEdit ? 'customer-edit-success' : 'customer-create-success'}
        />
      ) : null}

      {serverError ? (
        <ErrorAlert
          title={serverError}
          role="alert"
          aria-live="assertive"
          data-testid={isEdit ? 'customer-edit-error' : 'customer-create-error'}
        />
      ) : null}

      <CustomerFormSection titleKey="customer.section.customerInfo">
        <BilingualTranslatableField
          label={t('customer.field.fullName')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLabel')}
          bnValue={values.fullNameBn}
          enValue={values.fullNameEn}
          onBnChange={(value) => updateField('fullNameBn', value)}
          onEnChange={(value) => updateField('fullNameEn', value)}
          required
          bnError={fieldErrors.fullNameBn ? t(fieldErrors.fullNameBn) : undefined}
          enError={fieldErrors.fullNameEn ? t(fieldErrors.fullNameEn) : undefined}
          statusLabels={translationStatusLabels}
          retranslateLabel={t('customer.translation.retranslate')}
          disabled={isSubmitting}
        />

        <BilingualTranslatableField
          label={t('customer.field.address')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLabel')}
          bnValue={values.addressBn}
          enValue={values.addressEn}
          onBnChange={(value) => updateField('addressBn', value)}
          onEnChange={(value) => updateField('addressEn', value)}
          required
          multiline
          bnError={fieldErrors.addressBn ? t(fieldErrors.addressBn) : undefined}
          enError={fieldErrors.addressEn ? t(fieldErrors.addressEn) : undefined}
          statusLabels={translationStatusLabels}
          retranslateLabel={t('customer.translation.retranslate')}
          disabled={isSubmitting}
        />

        <BilingualTransliterationField
          label={t('customer.field.phone')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLatinLabel')}
          bnValue={values.phoneBn}
          enValue={values.phoneEn}
          onBnChange={(value) => updateField('phoneBn', value)}
          onEnChange={(value) => updateField('phoneEn', value)}
          mode="phone"
          required
          bnError={fieldErrors.phoneBn ? t(fieldErrors.phoneBn) : undefined}
          statusLabels={transliterationStatusLabels}
          reconvertLabel={t('customer.transliteration.reconvert')}
          disabled={isSubmitting}
        />
      </CustomerFormSection>

      <CustomerFormSection titleKey="customer.section.familyInfo">
        <BilingualTranslatableField
          label={t('customer.field.fatherName')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLabel')}
          bnValue={values.fatherNameBn}
          enValue={values.fatherNameEn}
          onBnChange={(value) => updateField('fatherNameBn', value)}
          onEnChange={(value) => updateField('fatherNameEn', value)}
          required
          bnError={fieldErrors.fatherNameBn ? t(fieldErrors.fatherNameBn) : undefined}
          enError={fieldErrors.fatherNameEn ? t(fieldErrors.fatherNameEn) : undefined}
          statusLabels={translationStatusLabels}
          retranslateLabel={t('customer.translation.retranslate')}
          disabled={isSubmitting}
        />

        <BilingualTranslatableField
          label={t('customer.field.mediatorName')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLabel')}
          bnValue={values.mediatorNameBn}
          enValue={values.mediatorNameEn}
          onBnChange={(value) => updateField('mediatorNameBn', value)}
          onEnChange={(value) => updateField('mediatorNameEn', value)}
          statusLabels={translationStatusLabels}
          retranslateLabel={t('customer.translation.retranslate')}
          disabled={isSubmitting}
        />
      </CustomerFormSection>

      <CustomerFormSection titleKey="customer.section.memoInfo">
        <BilingualTransliterationField
          label={t('customer.field.memoPageNumber')}
          bnLabel={t('customer.field.bnLabel')}
          enLabel={t('customer.field.enLatinLabel')}
          bnValue={values.memoPageNumberBn}
          enValue={values.memoPageNumberEn}
          onBnChange={(value) => updateField('memoPageNumberBn', value)}
          onEnChange={(value) => updateField('memoPageNumberEn', value)}
          mode="digits"
          required
          bnError={fieldErrors.memoPageNumberBn ? t(fieldErrors.memoPageNumberBn) : undefined}
          statusLabels={transliterationStatusLabels}
          reconvertLabel={t('customer.transliteration.reconvert')}
          disabled={isSubmitting}
        />
      </CustomerFormSection>

      <CustomerFormSection titleKey="customer.section.profilePicture" optional>
        {initialProfilePictureUrl && !profilePicture ? (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- existing profile from API */}
            <img
              src={initialProfilePictureUrl}
              alt=""
              className="max-h-40 rounded-lg border object-contain"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              <TranslatedText translationKey="customer.profile.replace" as="span" layout="inline" />
            </p>
          </div>
        ) : null}
        <ProfileImagePicker
          value={profilePicture}
          onChange={setProfilePicture}
          disabled={isSubmitting}
          labels={profileLabels}
        />
      </CustomerFormSection>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid={isEdit ? 'customer-edit-submit' : 'customer-create-submit'}
        >
          {t(submitKey)}
        </Button>
      </div>
    </form>
  );
}
