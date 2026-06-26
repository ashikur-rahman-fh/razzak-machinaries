'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  ConfirmDialog,
  Textarea,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

type ArchiveConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerNameBn: string;
  customerNameEn: string;
  phone: string;
  onConfirm: (archiveReason: string) => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function ArchiveConfirmationModal({
  open,
  onOpenChange,
  customerNameBn,
  customerNameEn,
  phone,
  onConfirm,
  isLoading = false,
  errorMessage,
}: ArchiveConfirmationModalProps) {
  const { displayMode, language, tPair } = useLanguagePreference();
  const [archiveReason, setArchiveReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const body = tPair('customer.archive.body');
  const warning = tPair('customer.archive.warning');

  async function handleConfirm() {
    if (!archiveReason.trim()) {
      setValidationError(
        language === 'bn' ? 'আর্কাইভের কারণ লিখুন।' : 'Archive reason is required.',
      );
      return;
    }
    setValidationError(null);
    await onConfirm(archiveReason.trim());
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey="customer.archive.title" as="span" layout="inline" />}
      description={
        <>
          <BilingualText
            bn={`${body.bn} ${customerNameBn} (${phone})। ${warning.bn}`}
            en={`${body.en} ${customerNameEn} (${phone}). ${warning.en}`}
            mode={displayMode}
            language={language}
            as="p"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="archive-reason">
              <TranslatedText translationKey="customer.archive.reason" as="span" compact />
            </label>
            <Textarea
              id="archive-reason"
              value={archiveReason}
              onChange={(event) => {
                setArchiveReason(event.target.value);
                setValidationError(null);
              }}
              rows={3}
            />
          </div>
          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </>
      }
      cancelLabel={<TranslatedText translationKey="customer.actions.cancel" as="span" compact />}
      confirmLabel={
        isLoading ? (
          <TranslatedText translationKey="customer.archive.archiving" as="span" compact />
        ) : (
          <TranslatedText translationKey="customer.archive.confirm" as="span" compact />
        )
      }
      onConfirm={handleConfirm}
      isLoading={isLoading}
      confirmVariant="destructive"
    />
  );
}
