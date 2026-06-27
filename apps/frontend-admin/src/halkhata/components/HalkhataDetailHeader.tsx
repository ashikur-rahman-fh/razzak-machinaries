'use client';

import type { Halkhata } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  Badge,
  Button,
  ConfirmDialog,
  Textarea,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { HALKHATA_STATUS_LABEL_KEYS } from '../constants';
import { buildInvitationsUrl } from '../routes';

type HalkhataDetailHeaderProps = {
  halkhata: Halkhata;
  onUpdateNotes: (notes: string) => Promise<void>;
  onToggleStatus: () => Promise<void>;
  isUpdating?: boolean;
};

export function HalkhataDetailHeader({
  halkhata,
  onUpdateNotes,
  onToggleStatus,
  isUpdating = false,
}: HalkhataDetailHeaderProps) {
  const { language, t } = useLanguagePreference();
  const [notes, setNotes] = useState(halkhata.notes);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isClosed = halkhata.status === 'closed';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync notes when halkhata reloads
    setNotes(halkhata.notes);
  }, [halkhata.notes]);

  async function handleSaveNotes() {
    if (notes === halkhata.notes) return;
    await onUpdateNotes(notes);
  }

  async function handleConfirmStatusChange() {
    await onToggleStatus();
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{halkhata.title}</h1>
            <Badge variant={isClosed ? 'secondary' : 'default'}>
              <TranslatedText
                translationKey={HALKHATA_STATUS_LABEL_KEYS[halkhata.status]}
                as="span"
                compact
              />
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{halkhata.date}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <TranslatedText translationKey="halkhata.detail.collected" as="span" compact />
              {': '}
              <span className="font-medium tabular-nums">
                {formatBdt(halkhata.totalCollected, language)}
              </span>
            </span>
            <span>
              <TranslatedText translationKey="halkhata.detail.paymentCount" as="span" compact />
              {': '}
              <span className="font-medium tabular-nums">{halkhata.paymentCount}</span>
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant={isClosed ? 'default' : 'outline'}
          onClick={() => setConfirmOpen(true)}
          disabled={isUpdating}
        >
          {isClosed ? (
            <TranslatedText translationKey="halkhata.detail.reopen" as="span" compact />
          ) : (
            <TranslatedText translationKey="halkhata.detail.close" as="span" compact />
          )}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={buildInvitationsUrl(halkhata.id)}>
            <TranslatedText translationKey="halkhata.invitations.open" as="span" compact />
          </Link>
        </Button>
      </div>

      {isClosed ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <TranslatedText translationKey="halkhata.detail.closedBanner" as="span" />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="halkhata-notes">
          <TranslatedText translationKey="halkhata.detail.notes" as="span" compact />
        </label>
        <Textarea
          id="halkhata-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('halkhata.detail.notesPlaceholder')}
          rows={3}
          disabled={isUpdating}
        />
        {!isClosed && notes !== halkhata.notes ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveNotes()}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <TranslatedText translationKey="halkhata.detail.savingNotes" as="span" compact />
            ) : (
              <TranslatedText translationKey="halkhata.detail.saveNotes" as="span" compact />
            )}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t(
          isClosed ? 'halkhata.detail.reopenConfirmTitle' : 'halkhata.detail.closeConfirmTitle',
        )}
        description={t(
          isClosed ? 'halkhata.detail.reopenConfirmMessage' : 'halkhata.detail.closeConfirmMessage',
        )}
        confirmLabel={isClosed ? t('halkhata.detail.reopen') : t('halkhata.detail.close')}
        cancelLabel={language === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={() => void handleConfirmStatusChange()}
        isLoading={isUpdating}
        confirmVariant={isClosed ? 'default' : 'destructive'}
      />
    </div>
  );
}
