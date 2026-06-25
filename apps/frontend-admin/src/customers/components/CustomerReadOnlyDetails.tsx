'use client';

import type { Customer } from '@razzak-machinaries/shared/api';
import { Button, Card, CardContent, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { buildEditUrl, getBackListUrl, type CustomerListState } from '../routes';
import { formatCustomerDate, formatCustomerPhone, hasMediator } from '../utils';
import { CustomerAvatar } from './CustomerAvatar';
import { CustomerDetailSection } from './CustomerDetailSection';
import { CustomerInfoRow } from './CustomerInfoRow';

type CustomerReadOnlyDetailsProps = {
  customer: Customer;
  listState?: Partial<CustomerListState>;
  fromQuery?: string | null;
  onDelete: () => void;
};

export function CustomerReadOnlyDetails({
  customer,
  listState,
  fromQuery,
  onDelete,
}: CustomerReadOnlyDetailsProps) {
  const backHref = getBackListUrl(fromQuery);
  const editHref = buildEditUrl(customer.id, listState);

  return (
    <div className="space-y-6" data-testid="customer-detail-content">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <TranslatedText translationKey="customer.detail.back" as="span" compact />
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>
              <TranslatedText translationKey="customer.actions.edit" as="span" compact />
            </Link>
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <TranslatedText translationKey="customer.actions.delete" as="span" compact />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <CustomerAvatar
            fullNameBn={customer.fullNameBn}
            fullNameEn={customer.fullNameEn}
            profilePictureUrl={customer.profilePictureUrl}
            size="lg"
          />
          <div className="space-y-1">
            <h1 className="font-bangla text-2xl font-semibold">{customer.fullNameBn}</h1>
            <p className="text-lg text-muted-foreground">{customer.fullNameEn}</p>
            <p className="text-sm">{formatCustomerPhone(customer)}</p>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="customer.field.memoPageNumber" as="span" compact />:{' '}
              <span className="font-bangla">{customer.memoPageNumberBn}</span>
              {customer.memoPageNumberEn !== customer.memoPageNumberBn
                ? ` (${customer.memoPageNumberEn})`
                : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <CustomerDetailSection titleKey="customer.detail.section.personal">
        <CustomerInfoRow
          labelKey="customer.field.fullName"
          valueBn={customer.fullNameBn}
          valueEn={customer.fullNameEn}
        />
        <CustomerInfoRow labelKey="customer.field.phone" value={formatCustomerPhone(customer)} />
        <CustomerInfoRow
          labelKey="customer.field.memoPageNumber"
          valueBn={customer.memoPageNumberBn}
          valueEn={customer.memoPageNumberEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.address">
        <CustomerInfoRow
          labelKey="customer.field.address"
          valueBn={customer.addressBn}
          valueEn={customer.addressEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.family">
        <CustomerInfoRow
          labelKey="customer.field.fatherName"
          valueBn={customer.fatherNameBn}
          valueEn={customer.fatherNameEn}
        />
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.mediator">
        {hasMediator(customer) ? (
          <CustomerInfoRow
            labelKey="customer.field.mediatorName"
            valueBn={customer.mediatorNameBn}
            valueEn={customer.mediatorNameEn}
          />
        ) : (
          <CustomerInfoRow labelKey="customer.field.mediatorName" />
        )}
      </CustomerDetailSection>

      <CustomerDetailSection titleKey="customer.detail.section.profilePicture">
        <div className="sm:col-span-2">
          {customer.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin profile preview from API URL
            <img
              src={customer.profilePictureUrl}
              alt=""
              className="max-h-64 rounded-lg border object-contain"
            />
          ) : (
            <div className="flex items-center gap-4">
              <CustomerAvatar
                fullNameBn={customer.fullNameBn}
                fullNameEn={customer.fullNameEn}
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

      <CustomerDetailSection titleKey="customer.detail.section.system">
        <CustomerInfoRow
          labelKey="customer.detail.field.createdAt"
          value={formatCustomerDate(customer.createdAt, 'en')}
        />
        <CustomerInfoRow
          labelKey="customer.detail.field.updatedAt"
          value={formatCustomerDate(customer.updatedAt, 'en')}
        />
      </CustomerDetailSection>

      <div className="flex justify-start">
        <Button asChild variant="outline">
          <Link href={backHref}>
            <TranslatedText translationKey="customer.actions.backToList" as="span" compact />
          </Link>
        </Button>
      </div>
    </div>
  );
}
