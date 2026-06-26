'use client';

import type { Transaction } from '@razzak-machinaries/shared/api';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, Card, CardContent } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { buildDetailUrl as buildCustomerDetailUrl } from '@/customers/routes';
import { buildDetailUrl, type TransactionListState } from '../routes';
import { TransactionTypeBadge } from './TransactionTypeBadge';

type TransactionMobileCardProps = {
  transaction: Transaction;
  listState?: Partial<TransactionListState>;
};

export function TransactionMobileCard({ transaction, listState }: TransactionMobileCardProps) {
  const router = useRouter();
  const { language, displayMode } = useLanguagePreference();
  const prefix = transaction.transactionType === 'PAYMENT' ? '-' : '+';
  const detailHref = buildDetailUrl(transaction.id, listState);

  return (
    <Card
      data-testid={`transaction-card-${transaction.id}`}
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
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
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
            <p className="text-sm text-muted-foreground">{transaction.date}</p>
          </div>
          <TransactionTypeBadge type={transaction.transactionType} />
        </div>
        <p
          className={`text-lg font-semibold ${
            transaction.transactionType === 'PAYMENT'
              ? 'text-emerald-700'
              : transaction.transactionType === 'SALE'
                ? 'text-amber-700'
                : ''
          }`}
        >
          {prefix}
          {formatBdt(transaction.totalAmount, language)}
        </p>
        {transaction.note ? (
          <p className="text-sm text-muted-foreground">{transaction.note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
