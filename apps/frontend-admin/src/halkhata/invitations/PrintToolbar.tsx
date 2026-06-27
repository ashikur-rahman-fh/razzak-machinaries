'use client';

import { Button, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { buildInvitationsUrl } from '../routes';
import { PrintActionButtons } from './PrintActionButtons';

export type InvitationPrintLayout = 'one' | 'two';

type PrintToolbarProps = {
  halkhataId: number;
  halkhataTitle: string;
  halkhataDate: string;
  invitationCount: number;
  layout: InvitationPrintLayout;
  onLayoutChange: (layout: InvitationPrintLayout) => void;
  onPrint: () => void;
};

export function PrintToolbar({
  halkhataId,
  halkhataTitle,
  halkhataDate,
  invitationCount,
  layout,
  onLayoutChange,
  onPrint,
}: PrintToolbarProps) {
  return (
    <div className="no-print mb-6 space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{halkhataTitle}</h1>
          <p className="text-sm text-muted-foreground">{halkhataDate}</p>
          <p className="text-sm">
            <TranslatedText translationKey="halkhata.invitations.print.total" as="span" compact />
            {': '}
            <span className="font-medium tabular-nums">{invitationCount}</span>
          </p>
        </div>
        <PrintActionButtons onPrint={onPrint} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildInvitationsUrl(halkhataId)}>
            <TranslatedText translationKey="halkhata.invitations.print.back" as="span" compact />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildInvitationsUrl(halkhataId)}>
            <TranslatedText
              translationKey="halkhata.invitations.print.editSelection"
              as="span"
              compact
            />
          </Link>
        </Button>
        <Button
          type="button"
          variant={layout === 'one' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onLayoutChange('one')}
        >
          <TranslatedText translationKey="halkhata.invitations.print.layoutOne" as="span" compact />
        </Button>
        <Button
          type="button"
          variant={layout === 'two' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onLayoutChange('two')}
        >
          <TranslatedText translationKey="halkhata.invitations.print.layoutTwo" as="span" compact />
        </Button>
      </div>
    </div>
  );
}
