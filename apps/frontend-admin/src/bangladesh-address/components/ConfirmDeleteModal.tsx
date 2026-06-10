'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, ConfirmDialog, TranslatedText } from '@razzak-machinaries/shared/ui';

type ConfirmDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordName: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

function DeleteModalMessage({ recordName }: { recordName: string }) {
  const { displayMode, language, tPair } = useLanguagePreference();
  const prefix = tPair('geo.delete.messagePrefix');
  const warning = tPair('geo.delete.warning');

  return (
    <BilingualText
      en={`${prefix.en} "${recordName}". ${warning.en}`}
      bn={`${prefix.bn} "${recordName}"। ${warning.bn}`}
      mode={displayMode}
      language={language}
      as="p"
    />
  );
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  recordName,
  onConfirm,
  isLoading = false,
  errorMessage,
}: ConfirmDeleteModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey="geo.delete.title" as="span" layout="inline" />}
      description={
        <>
          <DeleteModalMessage recordName={recordName} />
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </>
      }
      cancelLabel={<TranslatedText translationKey="geo.actions.cancel" as="span" compact />}
      confirmLabel={
        isLoading ? (
          <TranslatedText translationKey="geo.delete.deleting" as="span" compact />
        ) : (
          <TranslatedText translationKey="geo.delete.confirm" as="span" compact />
        )
      }
      onConfirm={onConfirm}
      isLoading={isLoading}
      confirmVariant="destructive"
    />
  );
}
