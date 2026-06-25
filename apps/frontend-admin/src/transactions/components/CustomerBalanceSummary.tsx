'use client';

import { adminTransactionsApi } from '@razzak-machinaries/shared/api';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  Skeleton,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { getAsyncData, useAsyncData } from '../hooks';
import { buildCustomerCreateUrl } from '../routes';

type CustomerBalanceSummaryProps = {
  customerId: number;
};

export function CustomerBalanceSummary({ customerId }: CustomerBalanceSummaryProps) {
  const { language, t } = useLanguagePreference();
  const { state, reload } = useAsyncData(
    () => adminTransactionsApi.getCustomerBalance(customerId),
    [customerId],
  );
  const balance = getAsyncData(state);

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <TranslatedText translationKey="transaction.customer.summary.title" as="span" compact />
          </p>
          <h2 className="mt-1 text-sm font-medium text-muted-foreground">
            <TranslatedText
              translationKey="transaction.customer.summary.currentBaki"
              as="span"
              compact
            />
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={buildCustomerCreateUrl(customerId)}>
              <TranslatedText
                translationKey="transaction.customer.actions.addTransaction"
                as="span"
                compact
              />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={buildCustomerCreateUrl(customerId, 'payment')}>
              <TranslatedText
                translationKey="transaction.customer.actions.recordPayment"
                as="span"
                compact
              />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={buildCustomerCreateUrl(customerId, 'sale')}>
              <TranslatedText
                translationKey="transaction.customer.actions.newSale"
                as="span"
                compact
              />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === 'loading' ? <Skeleton className="h-10 w-40" /> : null}
        {state.status === 'error' ? (
          <div className="space-y-2">
            <ErrorState
              message={
                <TranslatedText
                  translationKey="transaction.customer.summary.loadError"
                  as="span"
                  compact
                />
              }
            />
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void reload()}
            >
              {t('customer.actions.retry')}
            </button>
          </div>
        ) : null}
        {balance ? (
          <>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatBdt(balance.currentBalance, language)}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  <TranslatedText
                    translationKey="transaction.customer.summary.totalInitial"
                    as="span"
                    compact
                  />
                </p>
                <p className="mt-1 font-semibold">{formatBdt(balance.totalInitial, language)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  <TranslatedText
                    translationKey="transaction.customer.summary.totalSales"
                    as="span"
                    compact
                  />
                </p>
                <p className="mt-1 font-semibold">{formatBdt(balance.totalSales, language)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  <TranslatedText
                    translationKey="transaction.customer.summary.totalPayments"
                    as="span"
                    compact
                  />
                </p>
                <p className="mt-1 font-semibold">{formatBdt(balance.totalPayments, language)}</p>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
