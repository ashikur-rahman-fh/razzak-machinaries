'use client';

import type { Halkhata } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  Badge,
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

import { HALKHATA_STATUS_LABEL_KEYS } from '../constants';
import { buildDetailUrl } from '../routes';

type HalkhataListTableProps = {
  items: Halkhata[];
  isLoading?: boolean;
};

function formatDateTime(value: string, language: 'en' | 'bn'): string {
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function HalkhataListTable({ items, isLoading = false }: HalkhataListTableProps) {
  const router = useRouter();
  const { language } = useLanguagePreference();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
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
            <TranslatedText translationKey="halkhata.list.column.title" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.list.column.date" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.list.column.status" as="span" compact />
          </TableHead>
          <TableHead className="text-right">
            <TranslatedText translationKey="halkhata.list.column.collected" as="span" compact />
          </TableHead>
          <TableHead className="text-right">
            <TranslatedText translationKey="halkhata.list.column.payments" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.list.column.createdBy" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="halkhata.list.column.updated" as="span" compact />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => router.push(buildDetailUrl(item.id))}
          >
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>
              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                <TranslatedText
                  translationKey={HALKHATA_STATUS_LABEL_KEYS[item.status]}
                  as="span"
                  compact
                />
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatBdt(item.totalCollected, language)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{item.paymentCount}</TableCell>
            <TableCell>{item.createdByName ?? '—'}</TableCell>
            <TableCell>{formatDateTime(item.updatedAt, language)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
