'use client';

import type { Transaction } from '@razzak-machinaries/shared/api';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { buildDetailUrl as buildCustomerDetailUrl } from '@/customers/routes';
import { buildDetailUrl, type TransactionListState } from '../routes';
import { TransactionTypeBadge } from './TransactionTypeBadge';

type TransactionTableProps = {
  transactions: Transaction[];
  listState?: Partial<TransactionListState>;
};

function TableHeadLabel({ translationKey }: { translationKey: string }) {
  return <TranslatedText translationKey={translationKey} as="span" compact />;
}

export function TransactionTable({ transactions, listState }: TransactionTableProps) {
  const router = useRouter();
  const { language, displayMode } = useLanguagePreference();

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.customer" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.type" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.date" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.amount" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.impact" />
          </TableHead>
          <TableHead>
            <TableHeadLabel translationKey="transaction.list.column.created" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const prefix = transaction.transactionType === 'PAYMENT' ? '-' : '+';
          const detailHref = buildDetailUrl(transaction.id, listState);

          return (
            <TableRow
              key={transaction.id}
              data-testid={`transaction-row-${transaction.id}`}
              className="cursor-pointer"
              onClick={() => router.push(detailHref)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(detailHref);
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={`${transaction.customerNameEn}, ${transaction.date}`}
            >
              <TableCell>
                <Link
                  href={buildCustomerDetailUrl(transaction.customerId)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  <BilingualText
                    bn={transaction.customerNameBn}
                    en={transaction.customerNameEn}
                    language={language}
                    mode={displayMode}
                  />
                </Link>
              </TableCell>
              <TableCell>
                <TransactionTypeBadge type={transaction.transactionType} />
              </TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{formatBdt(transaction.totalAmount, language)}</TableCell>
              <TableCell>
                <span
                  className={
                    transaction.transactionType === 'PAYMENT'
                      ? 'font-medium text-emerald-700'
                      : transaction.transactionType === 'SALE'
                        ? 'font-medium text-amber-700'
                        : 'font-medium'
                  }
                >
                  {prefix}
                  {formatBdt(transaction.totalAmount, language)}
                </span>
              </TableCell>
              <TableCell>
                {new Date(transaction.createdAt).toLocaleString(
                  language === 'bn' ? 'bn-BD' : 'en-BD',
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </DataTable>
  );
}
