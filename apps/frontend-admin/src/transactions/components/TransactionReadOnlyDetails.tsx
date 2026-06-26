'use client';

import type { Transaction } from '@razzak-machinaries/shared/api';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { CustomerDetailSection } from '@/customers/components/CustomerDetailSection';
import { CustomerInfoRow } from '@/customers/components/CustomerInfoRow';
import { buildDetailUrl as buildCustomerDetailUrl } from '@/customers/routes';

import { PAYMENT_METHODS } from '../constants';
import { buildConfirmationUrl, getBackListUrl } from '../routes';
import { TransactionTypeBadge } from './TransactionTypeBadge';

const EMPTY_CELL_VALUE = '—';

type TransactionReadOnlyDetailsProps = {
  transaction: Transaction;
  fromQuery?: string | null;
};

function getPaymentMethodLabel(paymentMethod: string, t: (key: string) => string): string {
  const match = PAYMENT_METHODS.find((method) => method.value === paymentMethod);
  return match ? t(match.labelKey) : paymentMethod || EMPTY_CELL_VALUE;
}

function amountClassName(transactionType: Transaction['transactionType']): string {
  if (transactionType === 'PAYMENT') return 'font-semibold text-emerald-700';
  if (transactionType === 'SALE') return 'font-semibold text-amber-700';
  return 'font-semibold text-foreground';
}

function formatImpact(transaction: Transaction, language: 'en' | 'bn'): string {
  const prefix = transaction.transactionType === 'PAYMENT' ? '-' : '+';
  return `${prefix}${formatBdt(transaction.totalAmount, language)}`;
}

export function TransactionReadOnlyDetails({
  transaction,
  fromQuery,
}: TransactionReadOnlyDetailsProps) {
  const { language, displayMode } = useLanguagePreference();
  const { t } = useTranslation();
  const backHref = getBackListUrl(fromQuery);
  const canPrint =
    transaction.transactionType === 'SALE' || transaction.transactionType === 'PAYMENT';

  return (
    <div className="space-y-6" data-testid="transaction-detail-content">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <TranslatedText translationKey="transaction.detail.back" as="span" compact />
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={buildCustomerDetailUrl(transaction.customerId)}>
              <TranslatedText translationKey="transaction.detail.customer" as="span" compact />
            </Link>
          </Button>
          {canPrint ? (
            <Button asChild size="sm">
              <Link href={buildConfirmationUrl(transaction.id, { from: 'detail' })}>
                <TranslatedText translationKey="transaction.confirmation.print" as="span" compact />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                <TranslatedText translationKey="transaction.detail.title" as="span" />
              </h1>
              <p className="text-sm text-muted-foreground">
                <TranslatedText
                  translationKey="transaction.detail.transactionId"
                  as="span"
                  compact
                />
                {': '}
                {transaction.id}
              </p>
            </div>
            <TransactionTypeBadge type={transaction.transactionType} />
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <TranslatedText translationKey="transaction.create.date" as="span" compact />
              </p>
              <p className="text-lg">{transaction.date}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <TranslatedText translationKey="transaction.total" as="span" compact />
              </p>
              <p className={`text-2xl ${amountClassName(transaction.transactionType)}`}>
                {formatBdt(transaction.totalAmount, language)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <TranslatedText
                  translationKey="transaction.detail.balanceImpact"
                  as="span"
                  compact
                />
              </p>
              <p className={`text-lg ${amountClassName(transaction.transactionType)}`}>
                {formatImpact(transaction, language)}
              </p>
            </div>
          </div>
          {transaction.transactionType === 'INITIAL' ? (
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="transaction.confirmation.notAvailable" as="span" />
            </p>
          ) : null}
        </CardContent>
      </Card>

      <CustomerDetailSection titleKey="transaction.detail.title">
        <CustomerInfoRow labelKey="transaction.detail.customer">
          <Link
            href={buildCustomerDetailUrl(transaction.customerId)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            <BilingualText
              bn={transaction.customerNameBn}
              en={transaction.customerNameEn}
              language={language}
              mode={displayMode}
            />
          </Link>
        </CustomerInfoRow>
        <CustomerInfoRow labelKey="transaction.create.note" value={transaction.note} />
        {transaction.transactionType === 'PAYMENT' ? (
          <CustomerInfoRow
            labelKey="transaction.create.paymentMethod"
            value={getPaymentMethodLabel(transaction.paymentMethod, t)}
          />
        ) : null}
        <CustomerInfoRow
          labelKey="transaction.detail.createdBy"
          value={transaction.createdByName ?? EMPTY_CELL_VALUE}
        />
        <CustomerInfoRow
          labelKey="transaction.detail.createdAt"
          value={new Date(transaction.createdAt).toLocaleString(
            language === 'bn' ? 'bn-BD' : 'en-BD',
          )}
        />
      </CustomerDetailSection>

      {transaction.transactionType === 'SALE' ? (
        <CustomerDetailSection titleKey="transaction.detail.items">
          {transaction.items.length > 0 ? (
            <div className="col-span-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <TranslatedText
                        translationKey="transaction.create.productName"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <TranslatedText translationKey="transaction.unitPrice" as="span" compact />
                    </TableHead>
                    <TableHead className="text-right">
                      <TranslatedText translationKey="transaction.quantity" as="span" compact />
                    </TableHead>
                    <TableHead className="text-right">
                      <TranslatedText
                        translationKey="transaction.create.lineTotal"
                        as="span"
                        compact
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">
                        {formatBdt(item.unitPrice, language)}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatBdt(item.lineTotal, language)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      <TranslatedText
                        translationKey="transaction.create.grandTotal"
                        as="span"
                        compact
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBdt(transaction.totalAmount, language)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">{EMPTY_CELL_VALUE}</p>
          )}
        </CustomerDetailSection>
      ) : null}
    </div>
  );
}
