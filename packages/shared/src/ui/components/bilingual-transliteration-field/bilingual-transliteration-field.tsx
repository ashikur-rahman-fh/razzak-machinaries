'use client';

import { useId, useMemo } from 'react';

import { banglaToLatinDigitsOnly, banglaToLatinPhone } from '../../../i18n/bangla-script-utils';
import { Button } from '../button';
import { Input } from '../input';
import {
  useBilingualTransliteration,
  type TransliterationStatus,
} from './use-bilingual-transliteration';

export type BilingualTransliterationFieldProps = {
  label: string;
  bnLabel?: string;
  enLabel?: string;
  bnValue: string;
  enValue: string;
  onBnChange: (value: string) => void;
  onEnChange: (value: string) => void;
  mode: 'phone' | 'digits';
  required?: boolean;
  disabled?: boolean;
  bnError?: string;
  statusLabels?: Partial<Record<TransliterationStatus, string>>;
  reconvertLabel?: string;
};

const DEFAULT_STATUS_LABELS: Partial<Record<TransliterationStatus, string>> = {
  auto: 'Auto-converted',
  manual: 'Edited manually',
};

function StatusBadge({
  status,
  labels,
}: {
  status: TransliterationStatus;
  labels: Partial<Record<TransliterationStatus, string>>;
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
      data-testid={`transliteration-status-${status}`}
    >
      {text}
    </p>
  );
}

export function BilingualTransliterationField({
  label,
  bnLabel,
  enLabel,
  bnValue,
  enValue,
  onBnChange,
  onEnChange,
  mode,
  required = false,
  disabled = false,
  bnError,
  statusLabels = DEFAULT_STATUS_LABELS,
  reconvertLabel = 'Re-convert',
}: BilingualTransliterationFieldProps) {
  const bnFieldId = useId();
  const enFieldId = useId();
  const bnErrorId = useId();

  const convert = useMemo(
    () => (mode === 'phone' ? banglaToLatinPhone : banglaToLatinDigitsOnly),
    [mode],
  );

  const { status, handleEnChange, reconvert } = useBilingualTransliteration({
    bnValue,
    enValue,
    onEnChange,
    convert,
  });

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
        <Input
          id={bnFieldId}
          type={mode === 'phone' ? 'tel' : 'text'}
          inputMode="numeric"
          autoComplete={mode === 'phone' ? 'tel' : 'off'}
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
            {enLabel ?? 'Latin (auto-converted from Bangla, editable)'}
          </label>
          {bnValue.trim() ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reconvert}
              disabled={disabled}
              data-testid={`${label}-reconvert`}
            >
              {reconvertLabel}
            </Button>
          ) : null}
        </div>
        <StatusBadge status={status} labels={mergedStatusLabels} />
        <Input
          id={enFieldId}
          type={mode === 'phone' ? 'tel' : 'text'}
          inputMode="numeric"
          autoComplete={mode === 'phone' ? 'tel' : 'off'}
          value={enValue}
          onChange={(event) => handleEnChange(event.target.value)}
          data-testid={`${label}-en-input`}
        />
      </div>
    </fieldset>
  );
}
