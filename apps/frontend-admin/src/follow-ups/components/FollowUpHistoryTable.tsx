'use client';

import type { CustomerFollowUp } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';

import { formatCalendarDate } from '@/follow-ups/date-utils';
import { FollowUpStatusBadge } from '@/follow-ups/components/FollowUpStatusBadge';

type FollowUpHistoryTableProps = {
  history: CustomerFollowUp[];
};

export function FollowUpHistoryTable({ history }: FollowUpHistoryTableProps) {
  const { language } = useLanguagePreference();

  if (history.length === 0) {
    return (
      <EmptyState
        title={<TranslatedText translationKey="followUp.history.empty" as="span" layout="inline" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="follow-up-history-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <TranslatedText translationKey="followUp.date" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.status" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.note" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.createdBy" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.completedBy" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.createdAt" as="span" compact />
            </TableHead>
            <TableHead>
              <TranslatedText translationKey="followUp.updatedAt" as="span" compact />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id} data-testid={`follow-up-history-row-${item.id}`}>
              <TableCell>{formatCalendarDate(item.followUpDate, language)}</TableCell>
              <TableCell>
                <FollowUpStatusBadge status={item.status} />
              </TableCell>
              <TableCell className="max-w-[220px] truncate">{item.note || '—'}</TableCell>
              <TableCell>{item.createdByName ?? '—'}</TableCell>
              <TableCell>{item.completedByName ?? '—'}</TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}
              </TableCell>
              <TableCell>
                {new Date(item.updatedAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
