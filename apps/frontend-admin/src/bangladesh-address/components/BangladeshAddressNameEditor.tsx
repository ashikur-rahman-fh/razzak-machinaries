'use client';

import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Input,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useId, useRef, useState, type FormEvent } from 'react';

import { getGeoUpdateErrorMessage } from '../errors';
import type { GeoRecord } from '../types';
import {
  buildGeoNameUpdatePayload,
  getFieldChanges,
  hasGeoNameChanges,
  trimGeoFormValues,
  validateGeoForm,
  type GeoNameFormValues,
  type GeoNameUpdatePayload,
} from '../validation';
import { ConfirmUpdateModal } from './ConfirmUpdateModal';

type BangladeshAddressNameEditorProps = {
  record: GeoRecord;
  isLoading?: boolean;
  onSubmit: (payload: GeoNameUpdatePayload) => Promise<void>;
  onSuccess?: () => void;
};

export function BangladeshAddressNameEditor({
  record,
  isLoading = false,
  onSubmit,
  onSuccess,
}: BangladeshAddressNameEditorProps) {
  const { language } = useLanguagePreference();
  const { t } = useTranslation();

  const originalValues: GeoNameFormValues = {
    nameEn: record.nameEn,
    nameBn: record.nameBn,
  };

  const [nameEn, setNameEn] = useState(record.nameEn);
  const [nameBn, setNameBn] = useState(record.nameBn);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<GeoNameFormValues | null>(null);
  const pendingValuesRef = useRef<GeoNameFormValues | null>(null);

  const nameEnId = useId();
  const nameBnId = useId();
  const errorId = useId();

  const currentValues: GeoNameFormValues = { nameEn, nameBn };
  const trimmedCurrent = trimGeoFormValues({ ...currentValues, parentId: undefined });
  const hasChanges = hasGeoNameChanges(originalValues, currentValues);
  const canSave =
    hasChanges &&
    trimmedCurrent.nameEn.length > 0 &&
    trimmedCurrent.nameBn.length > 0 &&
    !isLoading &&
    !isSubmitting;

  function handleSaveClick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = trimGeoFormValues({ ...currentValues, parentId: undefined });
    const errors = validateGeoForm(trimmed, { requireParent: false });
    if (Object.keys(errors).length > 0) {
      const mapped: Record<string, string> = {};
      if (errors.nameEn) mapped.nameEn = 'geo.edit.requiredName';
      if (errors.nameBn) mapped.nameBn = 'geo.edit.requiredNameBn';
      setFieldErrors(mapped);
      return;
    }
    if (!hasGeoNameChanges(originalValues, trimmed)) {
      return;
    }
    setFieldErrors({});
    setServerError(null);
    pendingValuesRef.current = trimmed;
    setPendingValues(trimmed);
    setShowConfirm(true);
  }

  function handleReset() {
    setNameEn(originalValues.nameEn);
    setNameBn(originalValues.nameBn);
    setFieldErrors({});
    setServerError(null);
  }

  async function handleConfirmUpdate() {
    const values = pendingValuesRef.current;
    if (!values || isSubmitting) return;

    const payload = buildGeoNameUpdatePayload(originalValues, values);
    if (Object.keys(payload).length === 0) {
      setShowConfirm(false);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(payload);
      setShowConfirm(false);
      pendingValuesRef.current = null;
      setPendingValues(null);
      onSuccess?.();
    } catch (err) {
      setServerError(getGeoUpdateErrorMessage(err, language) || t('geo.update.nameFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const changes = pendingValues
    ? getFieldChanges(
        { ...originalValues, parentId: undefined },
        { ...pendingValues, parentId: undefined },
        {
          nameEn: 'geo.field.name',
          nameBn: 'geo.field.nameBn',
        },
      )
    : [];

  return (
    <>
      <Card data-testid="geo-name-editor">
        <CardHeader>
          <CardTitle>
            <TranslatedText translationKey="geo.detail.placeName" as="span" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSaveClick} noValidate>
            {serverError ? (
              <ErrorAlert
                id={errorId}
                title={
                  <TranslatedText
                    translationKey="geo.update.nameFailed"
                    as="span"
                    layout="inline"
                  />
                }
                description={serverError}
                role="alert"
              />
            ) : null}

            <div className="space-y-2">
              <label htmlFor={nameEnId} className="text-sm font-medium text-foreground">
                <TranslatedText translationKey="geo.field.name" as="span" />
              </label>
              <Input
                id={nameEnId}
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                aria-invalid={Boolean(fieldErrors.nameEn)}
                disabled={isLoading || isSubmitting}
                required
              />
              {fieldErrors.nameEn ? (
                <p className="text-sm text-destructive">
                  <TranslatedText
                    translationKey={fieldErrors.nameEn}
                    as="span"
                    layout="inline"
                    compact
                  />
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor={nameBnId} className="text-sm font-medium text-foreground">
                <TranslatedText translationKey="geo.field.nameBn" as="span" />
              </label>
              <Input
                id={nameBnId}
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="font-bangla"
                aria-invalid={Boolean(fieldErrors.nameBn)}
                disabled={isLoading || isSubmitting}
                required
              />
              {fieldErrors.nameBn ? (
                <p className="text-sm text-destructive">
                  <TranslatedText
                    translationKey={fieldErrors.nameBn}
                    as="span"
                    layout="inline"
                    compact
                  />
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!canSave} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <TranslatedText translationKey="geo.actions.saving" as="span" compact />
                ) : (
                  <TranslatedText translationKey="geo.actions.save" as="span" compact />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || isLoading || isSubmitting}
              >
                <TranslatedText translationKey="geo.actions.reset" as="span" compact />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmUpdateModal
        open={showConfirm}
        onOpenChange={(open) => {
          if (!isSubmitting) setShowConfirm(open);
        }}
        changes={changes}
        onConfirm={handleConfirmUpdate}
        isLoading={isSubmitting}
        titleKey="geo.update.nameTitle"
        messageKey="geo.update.nameMessage"
      />
    </>
  );
}
