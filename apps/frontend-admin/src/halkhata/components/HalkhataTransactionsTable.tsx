'use client';

import type { HalkhataTransaction } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  BilingualText,
  DataTable,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useRouter } from 'next/navigation';

import { buildDetailUrl as buildTransactionDetailUrl } from '@/transactions/routes';

type HalkhataTransactionsTableProps = {
  items: HalkhataTransaction[];
  isLoading?: boolean;
};

function formatDateTime(value: string, language: 'en' | 'bn'): string {
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function HalkhataTransactionsTable({
  items,
  isLoading = false,
}: HalkhataTransactionsTableProps) {
  const router = useRouter();
  const { language, displayMode } = useLanguagePreference();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>
            <TranslatedText
              translationKey="halkhata.transactions.column.paymentNumber"
              as="span"
              compact
            />
          </TableHead>
          <TableHead>
            <TranslatedText
              translationKey="halkhata.transactions.column.customer"
              as="span"
              compact
            />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.transactions.column.phone" as="span" compact />
          </TableHead>
          <TableHead className="text-right">
            <TranslatedText
              translationKey="halkhata.transactions.column.amount"
              as="span"
              compact
            />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.transactions.column.date" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText
              translationKey="halkhata.transactions.column.createdBy"
              as="span"
              compact
            />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.transactions.column.note" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText
              translationKey="halkhata.transactions.column.created"
              as="span"
              compact
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const detailHref = buildTransactionDetailUrl(item.id);

          return (
            <TableRow
              key={item.id}
              data-testid={`halkhata-payment-row-${item.id}`}
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
              aria-label={`${item.customerNameEn}, payment ${item.paymentNumber}`}
            >
              <TableCell className="font-medium text-primary">{item.paymentNumber}</TableCell>
              <TableCell>
                <BilingualText
                  bn={item.customerNameBn}
                  en={item.customerNameEn}
                  language={language}
                  mode={displayMode}
                />
              </TableCell>
              <TableCell>{item.customerPhone || '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBdt(item.totalAmount, language)}
              </TableCell>
              <TableCell>{item.date}</TableCell>
              <TableCell>{item.createdByName ?? '—'}</TableCell>
              <TableCell className="max-w-[12rem] truncate">{item.note || '—'}</TableCell>
              <TableCell>{formatDateTime(item.createdAt, language)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </DataTable>
  );
}
