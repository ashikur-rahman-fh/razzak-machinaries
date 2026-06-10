'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  ErrorAlert,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useId, useRef, useState, type FormEvent } from 'react';

import { getGeoConfig } from '../config';
import type { GeoRecord, GeoResourceType, ParentLookupMap } from '../types';
import {
  getFieldChanges,
  trimGeoFormValues,
  validateGeoForm,
  type GeoFormValues,
} from '../validation';
import { ConfirmUpdateModal } from './ConfirmUpdateModal';

type BangladeshAddressEditFormProps = {
  geoType: GeoResourceType;
  record: GeoRecord;
  parentOptions: ParentLookupMap;
  parentLabelKey?: string;
  onSubmit: (values: GeoFormValues) => Promise<void>;
  onCancel: () => void;
  serverError?: string | null;
};

export function BangladeshAddressEditForm({
  geoType,
  record,
  parentOptions,
  parentLabelKey,
  onSubmit,
  onCancel,
  serverError,
}: BangladeshAddressEditFormProps) {
  const { t } = useTranslation();
  const config = getGeoConfig(geoType);

  const initialParentId =
    geoType === 'districts' && 'divisionId' in record
      ? record.divisionId
      : geoType === 'upazilas' && 'districtId' in record
        ? record.districtId
        : geoType === 'unions' && 'upazilaId' in record
          ? record.upazilaId
          : undefined;

  const originalValues: GeoFormValues = {
    nameEn: record.nameEn,
    nameBn: record.nameBn,
    parentId: initialParentId,
  };

  const [nameEn, setNameEn] = useState(record.nameEn);
  const [nameBn, setNameBn] = useState(record.nameBn);
  const [parentId, setParentId] = useState<number | undefined>(initialParentId);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<GeoFormValues | null>(null);
  const pendingValuesRef = useRef<GeoFormValues | null>(null);

  const nameEnId = useId();
  const nameBnId = useId();
  const parentFieldId = useId();
  const errorId = useId();

  const currentValues: GeoFormValues = { nameEn, nameBn, parentId };
  const canSave =
    nameEn.trim().length > 0 &&
    nameBn.trim().length > 0 &&
    (!config.hasParentOnEdit || (parentId !== undefined && parentId > 0)) &&
    !isSubmitting;

  function handleSaveClick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = trimGeoFormValues(currentValues);
    const errors = validateGeoForm(trimmed, { requireParent: config.hasParentOnEdit });
    if (Object.keys(errors).length > 0) {
      const mapped: Record<string, string> = {};
      if (errors.nameEn) mapped.nameEn = 'geo.edit.requiredName';
      if (errors.nameBn) mapped.nameBn = 'geo.edit.requiredNameBn';
      if (errors.parentId) mapped.parentId = 'geo.edit.requiredParent';
      setFieldErrors(mapped);
      return;
    }
    setFieldErrors({});
    pendingValuesRef.current = trimmed;
    setPendingValues(trimmed);
    setShowConfirm(true);
  }

  async function handleConfirmUpdate() {
    const values = pendingValuesRef.current;
    if (!values || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setShowConfirm(false);
      pendingValuesRef.current = null;
      setPendingValues(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const changes = pendingValues
    ? getFieldChanges(originalValues, pendingValues, {
        nameEn: 'geo.field.name',
        nameBn: 'geo.field.nameBn',
        parent: parentLabelKey,
      })
    : [];

  const parentEntries = Array.from(parentOptions.entries()).sort((a, b) =>
    a[1].nameEn.localeCompare(b[1].nameEn),
  );

  return (
    <>
      <form className="space-y-4" onSubmit={handleSaveClick} noValidate data-testid="geo-edit-form">
        {serverError ? (
          <ErrorAlert
            id={errorId}
            title={
              <TranslatedText translationKey="geo.edit.saveFailed" as="span" layout="inline" />
            }
            description={serverError}
            role="alert"
          />
        ) : null}

        <div className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">
            <TranslatedText translationKey="geo.field.sourceId" as="span" layout="inline" compact />
          </span>
          <span className="font-mono">{record.id}</span>
        </div>

        <div className="space-y-2">
          <label htmlFor={nameEnId} className="text-sm font-medium text-foreground">
            <TranslatedText translationKey="geo.field.name" as="span" />
          </label>
          <Input
            id={nameEnId}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            aria-invalid={Boolean(fieldErrors.nameEn)}
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

        {config.hasParentOnEdit && parentLabelKey ? (
          <div className="space-y-2">
            <label htmlFor={parentFieldId} className="text-sm font-medium text-foreground">
              <TranslatedText translationKey={parentLabelKey} as="span" />
            </label>
            <Select
              value={parentId !== undefined ? String(parentId) : undefined}
              onValueChange={(value) => setParentId(Number(value))}
            >
              <SelectTrigger id={parentFieldId} aria-invalid={Boolean(fieldErrors.parentId)}>
                <SelectValue placeholder={t(parentLabelKey)} />
              </SelectTrigger>
              <SelectContent>
                {parentEntries.map(([id, names]) => (
                  <SelectItem key={id} value={String(id)}>
                    {names.nameEn} ({id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.parentId ? (
              <p className="text-sm text-destructive">
                <TranslatedText
                  translationKey={fieldErrors.parentId}
                  as="span"
                  layout="inline"
                  compact
                />
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSave} aria-busy={isSubmitting}>
            {isSubmitting ? (
              <TranslatedText translationKey="geo.actions.saving" as="span" compact />
            ) : (
              <TranslatedText translationKey="geo.actions.save" as="span" compact />
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <TranslatedText translationKey="geo.actions.cancel" as="span" compact />
          </Button>
        </div>
      </form>

      <ConfirmUpdateModal
        open={showConfirm}
        onOpenChange={(open) => {
          if (!isSubmitting) setShowConfirm(open);
        }}
        changes={changes}
        onConfirm={handleConfirmUpdate}
        isLoading={isSubmitting}
      />
    </>
  );
}
