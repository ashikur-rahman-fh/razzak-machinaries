'use client';

import { adminTransactionsApi, type Transaction } from '@razzak-machinaries/shared/api';
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
  WarningAlert,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { useCanAccessEditHistory } from '@/auth/permissions';
import { getTransactionCreateErrorMessage } from '../errors';
import { buildDetailUrl } from '../routes';
import { InitialBalanceFields } from './InitialBalanceFields';
import { PaymentFields } from './PaymentFields';
import { SaleItemsEditor } from './SaleItemsEditor';
import { TransactionBalancePreview } from './TransactionBalancePreview';
import {
  buildTransactionCorrectionPayload,
  getPreviewAmount,
  isTransactionFormValid,
  transactionToFormValues,
  validateTransactionForm,
  type TransactionFormValues,
} from '../validation';

type TransactionCorrectFormProps = {
  transaction: Transaction;
};

export function TransactionCorrectForm({ transaction }: TransactionCorrectFormProps) {
  const router = useRouter();
  const { language, t } = useLanguagePreference();
  const canAccessHistory = useCanAccessEditHistory();
  const [values, setValues] = useState<TransactionFormValues>(() =>
    transactionToFormValues(transaction),
  );
  const [editReason, setEditReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewAmount = useMemo(() => getPreviewAmount(values), [values]);
  const canSubmit = isTransactionFormValid(values) && editReason.trim().length > 0 && !isSubmitting;

  function updateValues(patch: Partial<TransactionFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    setFieldErrors({});
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateTransactionForm(values);
    if (!editReason.trim()) {
      errors.editReason = 'transaction.correct.validation.reason';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await adminTransactionsApi.createCorrection(
        transaction.id,
        buildTransactionCorrectionPayload(values, editReason),
      );
      router.push(buildDetailUrl(response.newTransaction.id));
    } catch (error) {
      setServerError(getTransactionCreateErrorMessage(error, language));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <WarningAlert
        title={
          <TranslatedText translationKey="transaction.correct.warningTitle" as="span" compact />
        }
        description={
          <TranslatedText
            translationKey={
              canAccessHistory ? 'transaction.correct.warning' : 'transaction.correct.warningStaff'
            }
            as="span"
          />
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            <TranslatedText translationKey="transaction.correct.title" as="span" />
          </h2>
          <p className="text-sm text-muted-foreground">
            {transaction.displayId} ·{' '}
            <TranslatedText
              translationKey={
                canAccessHistory
                  ? 'transaction.correct.subtitle'
                  : 'transaction.correct.subtitleStaff'
              }
              as="span"
              compact
            />
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="edit-reason">
              <TranslatedText translationKey="transaction.correct.reason" as="span" compact />
            </label>
            <Textarea
              id="edit-reason"
              value={editReason}
              onChange={(event) => {
                setEditReason(event.target.value);
                setFieldErrors((current) => ({ ...current, editReason: undefined }));
              }}
              rows={3}
            />
            {fieldErrors.editReason ? (
              <p className="text-sm text-destructive">{t(fieldErrors.editReason)}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="transaction-date">
              <TranslatedText translationKey="transaction.create.date" as="span" compact />
            </label>
            <Input
              id="transaction-date"
              type="date"
              value={values.date}
              onChange={(event) => updateValues({ date: event.target.value })}
            />
          </div>

          {values.transactionType === 'SALE' ? (
            <SaleItemsEditor
              items={values.items}
              fieldErrors={fieldErrors}
              onChange={(items) => updateValues({ items })}
            />
          ) : null}

          {values.transactionType === 'INITIAL' ? (
            <InitialBalanceFields
              amount={values.amount}
              error={fieldErrors.amount}
              onAmountChange={(amount) => updateValues({ amount })}
            />
          ) : null}

          {values.transactionType === 'PAYMENT' ? (
            <PaymentFields
              amount={values.amount}
              paymentMethod={values.paymentMethod}
              amountError={fieldErrors.amount}
              onAmountChange={(amount) => updateValues({ amount })}
              onPaymentMethodChange={(paymentMethod) => updateValues({ paymentMethod })}
            />
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="transaction-note">
              <TranslatedText translationKey="transaction.create.note" as="span" compact />
            </label>
            <Textarea
              id="transaction-note"
              value={values.note}
              onChange={(event) => updateValues({ note: event.target.value })}
              rows={2}
            />
          </div>

          <TransactionBalancePreview
            transactionType={values.transactionType}
            amount={previewAmount}
          />
        </CardContent>
      </Card>

      {serverError ? <ErrorAlert title={serverError} role="alert" /> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? (
            <TranslatedText translationKey="transaction.correct.saving" as="span" compact />
          ) : (
            <TranslatedText translationKey="transaction.correct.submit" as="span" compact />
          )}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={buildDetailUrl(transaction.id)}>
            <TranslatedText translationKey="customer.actions.cancel" as="span" compact />
          </Link>
        </Button>
      </div>
    </form>
  );
}
