'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import type { PaymentMethod } from '@razzak-machinaries/shared/api';

import { PAYMENT_METHODS } from '../constants';

type PaymentFieldsProps = {
  amount: string;
  paymentMethod: PaymentMethod | '';
  onAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  amountError?: string;
};

export function PaymentFields({
  amount,
  paymentMethod,
  onAmountChange,
  onPaymentMethodChange,
  amountError,
}: PaymentFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="transaction-payment-amount">
          <TranslatedText translationKey="transaction.create.paymentAmount" as="span" compact />
        </label>
        <Input
          id="transaction-payment-amount"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="0"
          aria-invalid={Boolean(amountError)}
        />
        {amountError ? (
          <p className="text-sm text-destructive" role="alert">
            <TranslatedText translationKey={amountError} as="span" compact />
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="transaction-payment-method">
          <TranslatedText translationKey="transaction.create.paymentMethod" as="span" compact />
        </label>
        <Select
          value={paymentMethod || 'cash'}
          onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
        >
          <SelectTrigger id="transaction-payment-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {t(method.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
