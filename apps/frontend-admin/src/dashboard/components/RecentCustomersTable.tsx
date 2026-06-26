'use client';

import type { DashboardRecentCustomer } from '@razzak-machinaries/shared/api';
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

import { buildDetailUrl } from '@/customers/routes';

const HIGH_DUE_THRESHOLD = 10000;

type RecentCustomersTableProps = {
  customers: DashboardRecentCustomer[];
};

export function RecentCustomersTable({ customers }: RecentCustomersTableProps) {
  const { language, displayMode } = useLanguagePreference();

  return (
    <Card data-testid="dashboard-recent-customers">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <TranslatedText translationKey="dashboard.recentCustomers.title" as="span" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {customers.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title={
                <TranslatedText
                  translationKey="dashboard.empty.customers"
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
                    <TranslatedText translationKey="dashboard.column.address" as="span" compact />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="dashboard.column.currentDue"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead className="text-right">
                    <TranslatedText translationKey="dashboard.column.actions" as="span" compact />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const dueAmount = Number(customer.currentBalance);
                  const isHighDue = dueAmount >= HIGH_DUE_THRESHOLD;

                  return (
                    <TableRow
                      key={customer.id}
                      data-testid={`dashboard-customer-row-${customer.id}`}
                    >
                      <TableCell className="font-medium">
                        <BilingualText
                          bn={customer.fullNameBn}
                          en={customer.fullNameEn}
                          language={language}
                          mode={displayMode}
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <BilingualText
                          bn={customer.addressBn}
                          en={customer.addressEn}
                          language={language}
                          mode={displayMode}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            isHighDue && 'text-amber-700 dark:text-amber-400',
                          )}
                        >
                          {formatBdt(customer.currentBalance, language)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={buildDetailUrl(customer.id)}>
                            <TranslatedText
                              translationKey="dashboard.action.viewProfile"
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
