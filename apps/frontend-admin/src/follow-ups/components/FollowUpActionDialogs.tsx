'use client';

import { ConfirmDialog, Textarea, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

type FollowUpCancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function FollowUpCancelDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  errorMessage,
}: FollowUpCancelDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey="followUp.cancel.title" as="span" layout="inline" />}
      description={
        <>
          <TranslatedText translationKey="followUp.cancel.body" as="p" />
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
          <TranslatedText translationKey="followUp.cancel.cancelling" as="span" compact />
        ) : (
          <TranslatedText translationKey="followUp.cancel.confirm" as="span" compact />
        )
      }
      onConfirm={onConfirm}
      isLoading={isLoading}
      confirmVariant="destructive"
    />
  );
}

type FollowUpCompleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (completionNote: string) => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function FollowUpCompleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  errorMessage,
}: FollowUpCompleteDialogProps) {
  const [completionNote, setCompletionNote] = useState('');

  async function handleConfirm() {
    await onConfirm(completionNote.trim());
    setCompletionNote('');
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setCompletionNote('');
        onOpenChange(nextOpen);
      }}
      title={<TranslatedText translationKey="followUp.complete.title" as="span" layout="inline" />}
      description={
        <>
          <TranslatedText translationKey="followUp.complete.body" as="p" />
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="completion-note">
              <TranslatedText translationKey="followUp.completionNoteOptional" as="span" compact />
            </label>
            <Textarea
              id="completion-note"
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
              rows={3}
            />
          </div>
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
          <TranslatedText translationKey="followUp.complete.completing" as="span" compact />
        ) : (
          <TranslatedText translationKey="followUp.complete.confirm" as="span" compact />
        )
      }
      onConfirm={handleConfirm}
      isLoading={isLoading}
    />
  );
}
