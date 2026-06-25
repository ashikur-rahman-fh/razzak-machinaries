'use client';

import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import type { TransactionType } from '@razzak-machinaries/shared/api';

type TransactionBalancePreviewProps = {
  transactionType: TransactionType;
  amount: string;
};

const PREVIEW_KEYS: Record<TransactionType, string> = {
  INITIAL: 'transaction.create.preview.initial',
  SALE: 'transaction.create.preview.sale',
  PAYMENT: 'transaction.create.preview.payment',
};

export function TransactionBalancePreview({
  transactionType,
  amount,
}: TransactionBalancePreviewProps) {
  const { language, t } = useLanguagePreference();
  const formatted = formatBdt(amount, language);
  const template = t(PREVIEW_KEYS[transactionType]);
  const message = template.replace('{amount}', formatted);

  const tone =
    transactionType === 'PAYMENT'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : transactionType === 'SALE'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-sky-200 bg-sky-50 text-sky-900';

  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${tone}`} role="status">
      {message}
    </p>
  );
}
