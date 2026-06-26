'use client';

import type { CustomerVersion } from '@razzak-machinaries/shared/api';
import { Card, CardContent, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { FieldChangeList } from '@/components/FieldChangeList';

import { buildCustomerVersionDetailUrl } from '../routes';
import { getCustomerVersionChanges } from '../version-diff';
import { CustomerVersionStatusBadge } from './CustomerVersionStatusBadge';

type CustomerVersionHistoryCardProps = {
  customerId: number;
  version: CustomerVersion;
  previousVersion?: CustomerVersion;
};

export function CustomerVersionHistoryCard({
  customerId,
  version,
  previousVersion,
}: CustomerVersionHistoryCardProps) {
  const changes =
    previousVersion != null ? getCustomerVersionChanges(previousVersion, version) : [];

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">
              <TranslatedText translationKey="customer.history.version" as="span" compact />{' '}
              {version.versionNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(version.createdAt).toLocaleString()}
            </p>
          </div>
          <CustomerVersionStatusBadge isCurrent={version.isCurrent} />
        </div>

        <div className="space-y-1">
          <p className="font-bangla text-base">{version.fullNameBn}</p>
          <p className="text-muted-foreground">{version.fullNameEn}</p>
        </div>

        {previousVersion ? (
          <p className="text-sm">
            <TranslatedText translationKey="customer.history.changedFrom" as="span" compact />{' '}
            <Link
              href={buildCustomerVersionDetailUrl(customerId, previousVersion.id)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              <TranslatedText translationKey="customer.history.version" as="span" compact />{' '}
              {previousVersion.versionNumber}
            </Link>
          </p>
        ) : null}

        {version.createdByName ? (
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="customer.history.changedBy" as="span" compact />:{' '}
            {version.createdByName}
          </p>
        ) : null}

        {version.changeReason ? (
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="customer.history.changeReason" as="span" compact />:{' '}
            {version.changeReason}
          </p>
        ) : null}

        {previousVersion ? (
          <div className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">
              <TranslatedText translationKey="customer.history.changes" as="span" compact />
            </p>
            <FieldChangeList
              changes={changes}
              emptyMessageKey="customer.history.noChanges"
              viewMode="unified"
            />
          </div>
        ) : null}

        <Link
          href={buildCustomerVersionDetailUrl(customerId, version.id)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <TranslatedText translationKey="customer.history.viewVersion" as="span" compact />
        </Link>
      </CardContent>
    </Card>
  );
}
