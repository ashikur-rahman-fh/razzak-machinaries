'use client';

import type { Customer, PaymentMethod } from '@razzak-machinaries/shared/api';
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

import { PaymentFields } from '@/transactions/components/PaymentFields';
import { todayIsoDate } from '@/transactions/constants';

import { HalkhataPaymentCustomerSummary } from './HalkhataPaymentCustomerSummary';
import { validateHalkhataPaymentForm, type HalkhataPaymentFormValues } from '../validation';

type HalkhataPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSubmit: (values: HalkhataPaymentFormValues) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function HalkhataPaymentModal({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isLoading = false,
  errorMessage = null,
}: HalkhataPaymentModalProps) {
  const { language } = useLanguagePreference();
  const [values, setValues] = useState<HalkhataPaymentFormValues>(() => ({
    amount: '',
    date: todayIsoDate(),
    note: '',
    paymentMethod: 'cash',
  }));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof HalkhataPaymentFormValues, string>>
  >({});

  function resetForm() {
    setValues({
      amount: '',
      date: todayIsoDate(),
      note: '',
      paymentMethod: 'cash',
    });
    setFieldErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isLoading) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateHalkhataPaymentForm(values, language);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await onSubmit(values);
      resetForm();
      onOpenChange(false);
    } catch {
      // Parent sets errorMessage; keep modal open.
    }
  }

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>
              <TranslatedText translationKey="halkhata.payment.title" as="span" />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <HalkhataPaymentCustomerSummary customer={customer} />

            <PaymentFields
              amount={values.amount}
              paymentMethod={(values.paymentMethod as PaymentMethod) || 'cash'}
              onAmountChange={(amount) => setValues((prev) => ({ ...prev, amount }))}
              onPaymentMethodChange={(paymentMethod) =>
                setValues((prev) => ({ ...prev, paymentMethod }))
              }
              amountError={fieldErrors.amount}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="halkhata-payment-date">
                <TranslatedText translationKey="transaction.create.date" as="span" compact />
              </label>
              <Input
                id="halkhata-payment-date"
                type="date"
                value={values.date}
                onChange={(event) => setValues((prev) => ({ ...prev, date: event.target.value }))}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.date)}
              />
              {fieldErrors.date ? (
                <p className="text-sm text-destructive" role="alert">
                  <TranslatedText translationKey={fieldErrors.date} as="span" compact />
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="halkhata-payment-note">
                <TranslatedText translationKey="transaction.create.note" as="span" compact />
              </label>
              <Textarea
                id="halkhata-payment-note"
                value={values.note}
                onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
                disabled={isLoading}
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
                <TranslatedText translationKey="halkhata.payment.saving" as="span" compact />
              ) : (
                <TranslatedText translationKey="halkhata.payment.submit" as="span" compact />
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
