'use client';

import { useId } from 'react';

import { Button } from '../button';
import { Input } from '../input';
import { Textarea } from '../textarea';
import { useBilingualTranslation, type TranslationStatus } from './use-bilingual-translation';

export type BilingualTranslatableFieldProps = {
  label: string;
  bnLabel?: string;
  enLabel?: string;
  bnValue: string;
  enValue: string;
  onBnChange: (value: string) => void;
  onEnChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  bnError?: string;
  enError?: string;
  statusLabels?: Partial<Record<TranslationStatus, string>>;
  retranslateLabel?: string;
};

const DEFAULT_STATUS_LABELS: Partial<Record<TranslationStatus, string>> = {
  translating: 'Translating…',
  auto: 'Auto-translated',
  manual: 'Edited manually',
  failed: 'Translation failed — enter manually',
};

function StatusBadge({
  status,
  labels,
}: {
  status: TranslationStatus;
  labels: Partial<Record<TranslationStatus, string>>;
}) {
  if (status === 'idle') {
    return null;
  }

  const text = labels[status];
  if (!text) {
    return null;
  }

  return (
    <p
      className="text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      data-testid={`translation-status-${status}`}
    >
      {text}
    </p>
  );
}

export function BilingualTranslatableField({
  label,
  bnLabel,
  enLabel,
  bnValue,
  enValue,
  onBnChange,
  onEnChange,
  required = false,
  multiline = false,
  disabled = false,
  bnError,
  enError,
  statusLabels = DEFAULT_STATUS_LABELS,
  retranslateLabel = 'Re-translate',
}: BilingualTranslatableFieldProps) {
  const bnFieldId = useId();
  const enFieldId = useId();
  const bnErrorId = useId();
  const enErrorId = useId();

  const { status, handleEnChange, retranslate } = useBilingualTranslation({
    bnValue,
    enValue,
    onEnChange,
  });

  const InputComponent = multiline ? Textarea : Input;
  const mergedStatusLabels = { ...DEFAULT_STATUS_LABELS, ...statusLabels };

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </legend>

      <div className="space-y-2">
        <label htmlFor={bnFieldId} className="text-sm font-medium">
          {bnLabel ?? 'Bangla'}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
        <InputComponent
          id={bnFieldId}
          value={bnValue}
          onChange={(event) => onBnChange(event.target.value)}
          className="font-bangla"
          aria-invalid={Boolean(bnError)}
          aria-describedby={bnError ? bnErrorId : undefined}
          data-testid={`${label}-bn-input`}
        />
        {bnError ? (
          <p id={bnErrorId} className="text-sm text-destructive">
            {bnError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={enFieldId} className="text-sm font-medium">
            {enLabel ?? 'English (auto-translated, editable)'}
            {required ? <span className="text-destructive"> *</span> : null}
          </label>
          {bnValue.trim() ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void retranslate()}
              disabled={disabled || status === 'translating'}
              data-testid={`${label}-retranslate`}
            >
              {retranslateLabel}
            </Button>
          ) : null}
        </div>
        <StatusBadge status={status} labels={mergedStatusLabels} />
        <InputComponent
          id={enFieldId}
          value={enValue}
          onChange={(event) => handleEnChange(event.target.value)}
          aria-invalid={Boolean(enError)}
          aria-describedby={enError ? enErrorId : undefined}
          data-testid={`${label}-en-input`}
        />
        {enError ? (
          <p id={enErrorId} className="text-sm text-destructive">
            {enError}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
