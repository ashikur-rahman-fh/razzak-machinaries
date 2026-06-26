'use client';

import type { EditHistoryEvent } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  Button,
  DataTable,
  EmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { buildEntityDetailUrl } from '../routes';
import { EditHistoryEventBadge } from './EditHistoryEventBadge';

type EditHistoryTableProps = {
  events: EditHistoryEvent[];
};

function formatOccurredAt(value: string, language: 'en' | 'bn'): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function EditHistoryTable({ events }: EditHistoryTableProps) {
  const { language } = useLanguagePreference();

  if (events.length === 0) {
    return (
      <EmptyState
        title={<TranslatedText translationKey="editHistory.empty" as="span" layout="inline" />}
      />
    );
  }

  return (
    <DataTable data-testid="edit-history-table">
      <TableHeader>
        <TableRow>
          <TableHead>
            <TranslatedText translationKey="editHistory.column.date" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="editHistory.column.event" as="span" compact />
          </TableHead>
          <TableHead>
            <TranslatedText translationKey="editHistory.column.entity" as="span" compact />
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <TranslatedText translationKey="editHistory.column.actor" as="span" compact />
          </TableHead>
          <TableHead className="hidden lg:table-cell">
            <TranslatedText translationKey="editHistory.column.reason" as="span" compact />
          </TableHead>
          <TableHead className="text-right">
            <TranslatedText translationKey="editHistory.column.actions" as="span" compact />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="whitespace-nowrap text-sm">
              {formatOccurredAt(event.occurredAt, language)}
            </TableCell>
            <TableCell>
              <EditHistoryEventBadge eventType={event.eventType} />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <BilingualText
                  en={event.entityLabelEn}
                  bn={event.entityLabelBn}
                  className="font-medium"
                />
                {event.transactionDisplayId ? (
                  <p className="text-xs text-muted-foreground">{event.transactionDisplayId}</p>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
              {event.actorName ?? '—'}
            </TableCell>
            <TableCell className="hidden max-w-xs truncate lg:table-cell text-sm text-muted-foreground">
              {event.reason ?? '—'}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildEntityDetailUrl(event.entityType, event.entityId, event.eventType)}
                >
                  <TranslatedText translationKey="editHistory.view" as="span" compact />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
