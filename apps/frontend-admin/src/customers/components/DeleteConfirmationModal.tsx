'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, ConfirmDialog, TranslatedText } from '@razzak-machinaries/shared/ui';

type DeleteConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerNameBn: string;
  customerNameEn: string;
  phone: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

function DeleteModalMessage({
  customerNameBn,
  customerNameEn,
  phone,
}: {
  customerNameBn: string;
  customerNameEn: string;
  phone: string;
}) {
  const { displayMode, language, tPair } = useLanguagePreference();
  const body = tPair('customer.delete.body');
  const warning = tPair('customer.delete.warning');

  return (
    <div className="space-y-2">
      <BilingualText
        bn={`${body.bn} ${customerNameBn} (${phone})। ${warning.bn}`}
        en={`${body.en} ${customerNameEn} (${phone}). ${warning.en}`}
        mode={displayMode}
        language={language}
        as="p"
      />
    </div>
  );
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  customerNameBn,
  customerNameEn,
  phone,
  onConfirm,
  isLoading = false,
  errorMessage,
}: DeleteConfirmationModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey="customer.delete.title" as="span" layout="inline" />}
      description={
        <>
          <DeleteModalMessage
            customerNameBn={customerNameBn}
            customerNameEn={customerNameEn}
            phone={phone}
          />
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
          <TranslatedText translationKey="customer.delete.deleting" as="span" compact />
        ) : (
          <TranslatedText translationKey="customer.delete.confirm" as="span" compact />
        )
      }
      onConfirm={onConfirm}
      isLoading={isLoading}
      confirmVariant="destructive"
    />
  );
}
