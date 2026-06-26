'use client';

import type { DashboardRecentTransaction } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  BilingualText,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
  cn,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { TransactionTypeBadge } from '@/transactions/components/TransactionTypeBadge';
import { buildDetailUrl } from '@/transactions/routes';

type RecentTransactionsTableProps = {
  transactions: DashboardRecentTransaction[];
};

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  const { language, displayMode } = useLanguagePreference();

  return (
    <Card data-testid="dashboard-recent-transactions">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <TranslatedText translationKey="dashboard.recentTransactions.title" as="span" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {transactions.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title={
                <TranslatedText
                  translationKey="dashboard.empty.transactions"
                  as="span"
                  layout="inline"
                />
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TranslatedText translationKey="dashboard.column.customer" as="span" compact />
                  </TableHead>
                  <TableHead>
                    <TranslatedText translationKey="dashboard.column.type" as="span" compact />
                  </TableHead>
                  <TableHead>
                    <TranslatedText translationKey="dashboard.column.amount" as="span" compact />
                  </TableHead>
                  <TableHead className="text-right">
                    <TranslatedText translationKey="dashboard.column.actions" as="span" compact />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const isPayment = transaction.transactionType === 'PAYMENT';
                  const prefix = isPayment ? '-' : '+';

                  return (
                    <TableRow
                      key={transaction.id}
                      data-testid={`dashboard-tx-row-${transaction.id}`}
                    >
                      <TableCell>
                        <BilingualText
                          bn={transaction.customerNameBn}
                          en={transaction.customerNameEn}
                          language={language}
                          mode={displayMode}
                        />
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge type={transaction.transactionType} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            isPayment
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400',
                          )}
                        >
                          {prefix}
                          {formatBdt(transaction.totalAmount, language)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={buildDetailUrl(transaction.id)}>
                            <TranslatedText
                              translationKey="dashboard.action.view"
                              as="span"
                              compact
                            />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
