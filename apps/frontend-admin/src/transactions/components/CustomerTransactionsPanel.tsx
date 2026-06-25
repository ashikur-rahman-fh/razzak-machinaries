'use client';

import { adminTransactionsApi, type Transaction } from '@razzak-machinaries/shared/api';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { getAsyncData, useAsyncData } from '../hooks';
import { buildListUrl } from '../routes';
import { TransactionTypeBadge } from './TransactionTypeBadge';

const EMPTY_CELL_VALUE = '—';
const COLUMN_COUNT = 4;
const SKELETON_ROW_COUNT = 3;

type CustomerTransactionsPanelProps = {
  customerId: number;
};

function TableHeadLabel({ translationKey }: { translationKey: string }) {
  return <TranslatedText translationKey={translationKey} as="span" compact />;
}

function formatImpact(transaction: Transaction, language: 'en' | 'bn'): string {
  const prefix = transaction.transactionType === 'PAYMENT' ? '-' : '+';
  return `${prefix}${formatBdt(transaction.totalAmount, language)}`;
}

function amountClassName(transactionType: Transaction['transactionType']): string {
  if (transactionType === 'PAYMENT') return 'font-semibold text-emerald-700';
  if (transactionType === 'SALE') return 'font-semibold text-amber-700';
  return 'font-semibold text-foreground';
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: COLUMN_COUNT }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function CustomerTransactionsPanel({ customerId }: CustomerTransactionsPanelProps) {
  const { language } = useLanguagePreference();
  const { state, reload } = useAsyncData(
    () =>
      adminTransactionsApi.listCustomerTransactions(customerId, {
        page: 1,
        pageSize: 10,
        ordering: '-date',
      }),
    [customerId],
  );
  const data = getAsyncData(state);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          <TranslatedText
            translationKey="transaction.customer.summary.recent"
            as="span"
            layout="inline"
          />
        </h2>
        <Link
          href={buildListUrl({ customerId })}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <TranslatedText translationKey="transaction.customer.summary.viewAll" as="span" compact />
        </Link>
      </CardHeader>
      <CardContent>
        {state.status === 'loading' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.type" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.date" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.note" />
                </TableHead>
                <TableHead className="text-right">
                  <TableHeadLabel translationKey="transaction.list.column.amount" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows />
            </TableBody>
          </Table>
        ) : null}
        {state.status === 'error' ? (
          <div className="space-y-2">
            <ErrorState
              message={
                <TranslatedText translationKey="transaction.list.loadError" as="span" compact />
              }
            />
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void reload()}
            >
              Retry
            </button>
          </div>
        ) : null}
        {data && data.results.length === 0 ? (
          <EmptyState
            title={
              <TranslatedText
                translationKey="transaction.customer.summary.empty"
                as="span"
                compact
              />
            }
          />
        ) : null}
        {data && data.results.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.type" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.date" />
                </TableHead>
                <TableHead>
                  <TableHeadLabel translationKey="transaction.list.column.note" />
                </TableHead>
                <TableHead className="text-right">
                  <TableHeadLabel translationKey="transaction.list.column.amount" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <TransactionTypeBadge type={transaction.transactionType} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {transaction.date}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.note || EMPTY_CELL_VALUE}
                  </TableCell>
                  <TableCell
                    className={`text-right ${amountClassName(transaction.transactionType)}`}
                  >
                    {formatImpact(transaction, language)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
