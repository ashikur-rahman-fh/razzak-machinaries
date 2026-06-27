'use client';

import type { CustomerFollowUp } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

import {
  defaultFollowUpDate,
  validateFollowUpForm,
  type FollowUpFormValues,
} from '@/follow-ups/validation';

type FollowUpModalMode = 'create' | 'reschedule';

type FollowUpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FollowUpModalMode;
  initialFollowUp?: CustomerFollowUp | null;
  onSubmit: (values: FollowUpFormValues) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

type FollowUpModalFormProps = {
  mode: FollowUpModalMode;
  initialFollowUp?: CustomerFollowUp | null;
  onSubmit: (values: FollowUpFormValues) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
};

function FollowUpModalForm({
  mode,
  initialFollowUp,
  onSubmit,
  isLoading,
  errorMessage,
  onOpenChange,
}: FollowUpModalFormProps) {
  const { language } = useLanguagePreference();
  const [values, setValues] = useState<FollowUpFormValues>(() => ({
    followUpDate: initialFollowUp?.followUpDate ?? defaultFollowUpDate(),
    note: initialFollowUp?.note ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FollowUpFormValues, string>>>(
    {},
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateFollowUpForm(values, language);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    await onSubmit(values);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <DialogHeader>
        <DialogTitle>
          <TranslatedText
            translationKey={
              mode === 'create' ? 'followUp.modal.createTitle' : 'followUp.modal.rescheduleTitle'
            }
            as="span"
          />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="follow-up-date">
            <TranslatedText translationKey="followUp.date" as="span" compact />
          </label>
          <Input
            id="follow-up-date"
            type="date"
            data-testid="follow-up-date-input"
            value={values.followUpDate}
            onChange={(event) => {
              setValues((current) => ({ ...current, followUpDate: event.target.value }));
              setFieldErrors((current) => ({ ...current, followUpDate: undefined }));
            }}
          />
          {fieldErrors.followUpDate ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.followUpDate}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="follow-up-note">
            <TranslatedText translationKey="followUp.noteOptional" as="span" compact />
          </label>
          <Textarea
            id="follow-up-note"
            value={values.note}
            onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
            rows={3}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          <TranslatedText translationKey="customer.actions.cancel" as="span" compact />
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <TranslatedText translationKey="followUp.actions.saving" as="span" compact />
          ) : (
            <TranslatedText translationKey="followUp.actions.save" as="span" compact />
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function FollowUpModal({
  open,
  onOpenChange,
  mode,
  initialFollowUp,
  onSubmit,
  isLoading = false,
  errorMessage,
}: FollowUpModalProps) {
  const formKey = `${mode}-${initialFollowUp?.id ?? 'new'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="follow-up-modal">
        {open ? (
          <FollowUpModalForm
            key={formKey}
            mode={mode}
            initialFollowUp={initialFollowUp}
            onSubmit={onSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
