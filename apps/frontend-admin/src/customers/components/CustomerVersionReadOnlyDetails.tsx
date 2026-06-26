'use client';

import type { CustomerVersion } from '@razzak-machinaries/shared/api';
import { Button, Card, CardContent, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { FieldChangeList } from '@/components/FieldChangeList';

import { buildCustomerHistoryUrl, buildDetailUrl } from '../routes';
import { getCustomerVersionChanges } from '../version-diff';
import { formatCustomerDate, hasMediator } from '../utils';
import { CustomerAvatar } from './CustomerAvatar';
import { CustomerDetailSection } from './CustomerDetailSection';
import { CustomerInfoRow } from './CustomerInfoRow';
import { CustomerVersionStatusBadge } from './CustomerVersionStatusBadge';

type CustomerVersionReadOnlyDetailsProps = {
  customerId: number;
  version: CustomerVersion;
  previousVersion?: CustomerVersion;
};

export function CustomerVersionReadOnlyDetails({
  customerId,
  version,
  previousVersion,
}: CustomerVersionReadOnlyDetailsProps) {
  const changes =
    previousVersion != null ? getCustomerVersionChanges(previousVersion, version) : [];
  const backHref = buildCustomerHistoryUrl(customerId);

  return (
    <div className="space-y-6" data-testid="customer-version-detail-content">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <TranslatedText translationKey="customer.history.back" as="span" compact />
          </Link>
        </Button>
        <div className="ml-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={buildDetailUrl(customerId)}>
              <TranslatedText translationKey="customer.actions.view" as="span" compact />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                <TranslatedText translationKey="customer.history.versionDetailTitle" as="span" />
              </h1>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="customer.history.version" as="span" compact />{' '}
                {version.versionNumber}
              </p>
            </div>
            <CustomerVersionStatusBadge isCurrent={version.isCurrent} />
          </div>

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

          <p className="text-sm text-muted-foreground">
            {formatCustomerDate(version.createdAt, 'en')}
          </p>
        </CardContent>
      </Card>

      {previousVersion ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-amber-900">
              <TranslatedText translationKey="customer.history.changes" as="span" compact />
            </p>
            <FieldChangeList
              changes={changes}
              emptyMessageKey="customer.history.noChanges"
              viewMode="split"
              beforeTitleKey="customer.history.diff.before"
              afterTitleKey="customer.history.diff.after"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <CustomerAvatar
            fullNameBn={version.fullNameBn}
            fullNameEn={version.fullNameEn}
            profilePictureUrl={version.profilePictureUrl}
            size="lg"
          />
          <div className="space-y-1">
            <h2 className="font-bangla text-2xl font-semibold">{version.fullNameBn}</h2>
            <p className="text-lg text-muted-foreground">{version.fullNameEn}</p>
            <p className="text-sm">
              {version.phoneBn}
              {version.phoneEn !== version.phoneBn ? ` (${version.phoneEn})` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <CustomerDetailSection titleKey="customer.detail.section.personal">
        <CustomerInfoRow
          labelKey="customer.field.fullName"
          valueBn={version.fullNameBn}
          valueEn={version.fullNameEn}
        />
        <CustomerInfoRow
          labelKey="customer.field.phone"
          value={version.phoneEn || version.phoneBn}
        />
        <CustomerInfoRow
          labelKey="customer.field.memoPageNumber"
          valueBn={version.memoPageNumberBn}
          valueEn={version.memoPageNumberEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.address">
        <CustomerInfoRow
          labelKey="customer.field.address"
          valueBn={version.addressBn}
          valueEn={version.addressEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.family">
        <CustomerInfoRow
          labelKey="customer.field.fatherName"
          valueBn={version.fatherNameBn}
          valueEn={version.fatherNameEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.mediator">
        {hasMediator(version) ? (
          <CustomerInfoRow
            labelKey="customer.field.mediatorName"
            valueBn={version.mediatorNameBn}
            valueEn={version.mediatorNameEn}
          />
        ) : (
          <CustomerInfoRow labelKey="customer.field.mediatorName" />
        )}
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.profilePicture">
        <div className="sm:col-span-2">
          {version.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin profile preview from API URL
            <img
              src={version.profilePictureUrl}
              alt=""
              className="max-h-64 rounded-lg border object-contain"
            />
          ) : (
            <div className="flex items-center gap-4">
              <CustomerAvatar
                fullNameBn={version.fullNameBn}
                fullNameEn={version.fullNameEn}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                <TranslatedText
                  translationKey="customer.detail.noProfilePicture"
                  as="span"
                  layout="inline"
                />
              </p>
            </div>
          )}
        </div>
      </CustomerDetailSection>
    </div>
  );
}
