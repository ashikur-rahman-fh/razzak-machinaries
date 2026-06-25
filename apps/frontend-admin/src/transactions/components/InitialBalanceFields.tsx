'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import { Input, TranslatedText } from '@razzak-machinaries/shared/ui';

type InitialBalanceFieldsProps = {
  amount: string;
  onAmountChange: (value: string) => void;
  error?: string;
};

export function InitialBalanceFields({ amount, onAmountChange, error }: InitialBalanceFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor="transaction-initial-amount">
        <TranslatedText translationKey="transaction.create.initialAmount" as="span" compact />
      </label>
      <Input
        id="transaction-initial-amount"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        placeholder="0.00"
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          <TranslatedText translationKey={error} as="span" compact />
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t('transaction.create.amount')}</p>
      )}
    </div>
  );
}
