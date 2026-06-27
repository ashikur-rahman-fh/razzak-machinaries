import type { Language } from '@razzak-machinaries/shared/i18n';

import type { CreateHalkhataFormValues } from './routes';

export type HalkhataPaymentFormValues = {
  amount: string;
  date: string;
  note: string;
  paymentMethod: string;
};

export function validateCreateHalkhataForm(
  values: CreateHalkhataFormValues,
  _language: Language,
): Partial<Record<keyof CreateHalkhataFormValues, string>> {
  const errors: Partial<Record<keyof CreateHalkhataFormValues, string>> = {};
  if (!values.title.trim()) {
    errors.title = 'halkhata.create.validation.title';
  }
  if (!values.date.trim()) {
    errors.date = 'halkhata.create.validation.date';
  }
  return errors;
}

export function validateHalkhataPaymentForm(
  values: HalkhataPaymentFormValues,
  _language: Language,
): Partial<Record<keyof HalkhataPaymentFormValues, string>> {
  const errors: Partial<Record<keyof HalkhataPaymentFormValues, string>> = {};
  const amount = Number(values.amount);
  if (!values.amount.trim() || Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'halkhata.payment.validation.amount';
  }
  if (!values.date.trim()) {
    errors.date = 'halkhata.create.validation.date';
  }
  return errors;
}
