'use client';

import type { HalkhataInvitationPageContext } from '@razzak-machinaries/shared/api';
import { STORE_CONFIG } from '@razzak-machinaries/shared/constants/store';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { Card, CardContent, CardHeader, TranslatedText } from '@razzak-machinaries/shared/ui';

import { getSelectedCustomerCount, type InvitationSelectionState } from './utils';

type InvitationGenerationSummaryProps = {
  context: HalkhataInvitationPageContext;
  selection: InvitationSelectionState;
};

export function InvitationGenerationSummary({
  context,
  selection,
}: InvitationGenerationSummaryProps) {
  const { language } = useLanguagePreference();
  const selectedCount = getSelectedCustomerCount(selection, context);

  return (
    <Card>
      <CardHeader>
        <TranslatedText
          translationKey="halkhata.invitations.summaryTitle"
          as="div"
          className="text-lg font-semibold"
        />
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryItem labelKey="halkhata.invitations.halkhataName" value={context.halkhataTitle} />
        <SummaryItem labelKey="halkhata.invitations.halkhataDate" value={context.halkhataDate} />
        <SummaryItem
          labelKey="halkhata.invitations.storeName"
          value={STORE_CONFIG.invitationNameBn}
        />
        <SummaryItem labelKey="halkhata.invitations.storeAddress" value={STORE_CONFIG.addressBn} />
        <SummaryItem labelKey="halkhata.invitations.storePhone" value={STORE_CONFIG.phone} />
        <SummaryItem
          labelKey="halkhata.invitations.totalCustomers"
          value={String(context.totalActiveCustomers)}
        />
        <SummaryItem
          labelKey="halkhata.invitations.selectedCustomers"
          value={String(selectedCount)}
          highlight
        />
        <SummaryItem
          labelKey="halkhata.invitations.generationCount"
          value={String(context.generationCount)}
        />
        {language === 'en' ? (
          <SummaryItem labelKey="halkhata.invitations.storeNameEn" value={STORE_CONFIG.nameEn} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  labelKey,
  value,
  highlight = false,
}: {
  labelKey: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <TranslatedText
        translationKey={labelKey}
        as="p"
        className="text-sm text-muted-foreground"
        compact
      />
      <p className={highlight ? 'text-lg font-semibold tabular-nums' : 'text-sm font-medium'}>
        {value}
      </p>
    </div>
  );
}
