'use client';

import { adminTransactionsApi, type Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ErrorAlert,
  Input,
  Textarea,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { getTransactionCreateErrorMessage } from '../errors';
import { InitialBalanceFields } from './InitialBalanceFields';
import { PaymentFields } from './PaymentFields';
import { SaleItemsEditor } from './SaleItemsEditor';
import { TransactionBalancePreview } from './TransactionBalancePreview';
import { TransactionCustomerSelect } from './TransactionCustomerSelect';
import { TransactionTypeTabs } from './TransactionTypeTabs';
import { parseTransactionTypeParam } from '../constants';
import {
  buildTransactionWritePayload,
  createEmptySaleItem,
  EMPTY_TRANSACTION_FORM,
  getPreviewAmount,
  isTransactionFormValid,
  validateTransactionForm,
  type TransactionFormValues,
} from '../validation';

type TransactionCreateFormProps = {
  preselectedCustomerId?: number;
  preselectedCustomer?: Customer | null;
  initialType?: string | null;
  backHref?: string;
};

export function TransactionCreateForm({
  preselectedCustomerId,
  preselectedCustomer = null,
  initialType = null,
  backHref,
}: TransactionCreateFormProps) {
  const router = useRouter();
  const { language, t } = useLanguagePreference();
  const [values, setValues] = useState<TransactionFormValues>(() => ({
    ...EMPTY_TRANSACTION_FORM,
    customerId: preselectedCustomerId ?? null,
    transactionType: parseTransactionTypeParam(initialType),
    items: [createEmptySaleItem()],
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewAmount = useMemo(() => getPreviewAmount(values), [values]);
  const canSubmit = isTransactionFormValid(values) && !isSubmitting;

  function updateValues(patch: Partial<TransactionFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    setFieldErrors({});
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateTransactionForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    try {
      await adminTransactionsApi.createTransaction(buildTransactionWritePayload(values));
      const customerId = values.customerId!;
      router.push(`/customers/${customerId}?success=transactionCreated`);
    } catch (error) {
      setServerError(getTransactionCreateErrorMessage(error, language));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">
            <TranslatedText translationKey="transaction.create.title" as="span" layout="inline" />
          </h1>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError ? <ErrorAlert title={serverError} role="alert" /> : null}

          <TransactionCustomerSelect
            value={values.customerId}
            onChange={(customerId) => updateValues({ customerId })}
            preselectedCustomer={preselectedCustomer}
            disabled={Boolean(preselectedCustomerId && preselectedCustomer)}
            error={fieldErrors.customerId}
          />

          <TransactionTypeTabs
            value={values.transactionType}
            onChange={(transactionType) =>
              updateValues({
                transactionType,
                items: transactionType === 'SALE' ? [createEmptySaleItem()] : values.items,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="transaction-date">
                <TranslatedText translationKey="transaction.create.date" as="span" compact />
              </label>
              <Input
                id="transaction-date"
                type="date"
                value={values.date}
                onChange={(event) => updateValues({ date: event.target.value })}
                aria-invalid={Boolean(fieldErrors.date)}
              />
              {fieldErrors.date ? (
                <p className="text-sm text-destructive" role="alert">
                  <TranslatedText translationKey={fieldErrors.date} as="span" compact />
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="transaction-note">
              <TranslatedText translationKey="transaction.create.note" as="span" compact />
            </label>
            <Textarea
              id="transaction-note"
              value={values.note}
              onChange={(event) => updateValues({ note: event.target.value })}
              rows={3}
            />
          </div>

          {values.transactionType === 'INITIAL' ? (
            <InitialBalanceFields
              amount={values.amount}
              onAmountChange={(amount) => updateValues({ amount })}
              error={fieldErrors.amount}
            />
          ) : null}

          {values.transactionType === 'PAYMENT' ? (
            <PaymentFields
              amount={values.amount}
              paymentMethod={values.paymentMethod}
              onAmountChange={(amount) => updateValues({ amount })}
              onPaymentMethodChange={(paymentMethod) => updateValues({ paymentMethod })}
              amountError={fieldErrors.amount}
            />
          ) : null}

          {values.transactionType === 'SALE' ? (
            <SaleItemsEditor
              items={values.items}
              onChange={(items) => updateValues({ items })}
              fieldErrors={fieldErrors}
            />
          ) : null}

          {values.customerId ? (
            <TransactionBalancePreview
              transactionType={values.transactionType}
              amount={previewAmount}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="transaction.create.noCustomer" as="span" compact />
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {backHref ? (
              <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
                {language === 'bn' ? 'ফিরে যান' : 'Back'}
              </Button>
            ) : null}
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? t('transaction.create.saving') : t('transaction.create.submit')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
