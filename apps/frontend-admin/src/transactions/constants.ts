import type { PaymentMethod, TransactionType } from '@razzak-machinaries/shared/api';

export const FEEDBACK_DISMISS_MS = 5000;

export const TRANSACTION_TYPES: TransactionType[] = ['INITIAL', 'SALE', 'PAYMENT'];

export const PAYMENT_METHODS: { value: PaymentMethod; labelKey: string }[] = [
  { value: 'cash', labelKey: 'transaction.paymentMethod.cash' },
  { value: 'bank', labelKey: 'transaction.paymentMethod.bank' },
  { value: 'bkash', labelKey: 'transaction.paymentMethod.bkash' },
  { value: 'nagad', labelKey: 'transaction.paymentMethod.nagad' },
  { value: 'other', labelKey: 'transaction.paymentMethod.other' },
];

export const TRANSACTION_TYPE_LABEL_KEYS: Record<TransactionType, string> = {
  INITIAL: 'transaction.type.initial',
  SALE: 'transaction.type.sale',
  PAYMENT: 'transaction.type.payment',
};

export function parseTransactionTypeParam(value: string | null): TransactionType {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'sale') return 'SALE';
  if (normalized === 'payment') return 'PAYMENT';
  if (normalized === 'initial') return 'INITIAL';
  return 'SALE';
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
