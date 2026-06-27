'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

import { defaultCreateHalkhataValues, type CreateHalkhataFormValues } from '../routes';
import { validateCreateHalkhataForm } from '../validation';

type CreateHalkhataModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateHalkhataFormValues) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function CreateHalkhataModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  errorMessage = null,
}: CreateHalkhataModalProps) {
  const { language } = useLanguagePreference();
  const [values, setValues] = useState<CreateHalkhataFormValues>(() =>
    defaultCreateHalkhataValues(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateHalkhataFormValues, string>>
  >({});

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateCreateHalkhataForm(values, language);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    await onSubmit(values);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setValues(defaultCreateHalkhataValues());
      setFieldErrors({});
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>
              <TranslatedText translationKey="halkhata.create.title" as="span" />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="halkhata-create-title">
                <TranslatedText translationKey="halkhata.create.name" as="span" compact />
              </label>
              <Input
                id="halkhata-create-title"
                value={values.title}
                onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                aria-invalid={Boolean(fieldErrors.title)}
                disabled={isLoading}
                autoFocus
              />
              {fieldErrors.title ? (
                <p className="text-sm text-destructive" role="alert">
                  <TranslatedText translationKey={fieldErrors.title} as="span" compact />
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="halkhata-create-date">
                <TranslatedText translationKey="halkhata.create.date" as="span" compact />
              </label>
              <Input
                id="halkhata-create-date"
                type="date"
                value={values.date}
                onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
                aria-invalid={Boolean(fieldErrors.date)}
                disabled={isLoading}
              />
              {fieldErrors.date ? (
                <p className="text-sm text-destructive" role="alert">
                  <TranslatedText translationKey={fieldErrors.date} as="span" compact />
                </p>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? (
                <TranslatedText translationKey="halkhata.create.saving" as="span" compact />
              ) : (
                <TranslatedText translationKey="halkhata.create.submit" as="span" compact />
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
