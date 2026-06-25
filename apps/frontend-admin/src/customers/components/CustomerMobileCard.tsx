'use client';

import type { Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  Button,
  Card,
  CardContent,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { buildDetailUrl, buildEditUrl, type CustomerListState } from '../routes';
import {
  formatCustomerDate,
  formatCustomerPhone,
  hasMediator,
  truncateAddress,
  EMPTY_CELL_VALUE,
} from '../utils';
import { CustomerAvatar } from './CustomerAvatar';

type CustomerMobileCardProps = {
  customer: Customer;
  listState: CustomerListState;
};

export function CustomerMobileCard({ customer, listState }: CustomerMobileCardProps) {
  const { language, displayMode } = useLanguagePreference();
  const detailHref = buildDetailUrl(customer.id, listState);
  const editHref = buildEditUrl(customer.id, listState);

  return (
    <Card className="lg:hidden" data-testid={`customer-card-${customer.id}`}>
      <CardContent className="space-y-3 p-4">
        <Link
          href={detailHref}
          className="flex items-start gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <CustomerAvatar
            fullNameBn={customer.fullNameBn}
            fullNameEn={customer.fullNameEn}
            profilePictureUrl={customer.profilePictureUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bangla font-medium">{customer.fullNameBn}</p>
            <p className="text-sm text-muted-foreground">{customer.fullNameEn}</p>
            <p className="mt-1 text-sm">{formatCustomerPhone(customer)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <TranslatedText translationKey="customer.field.memoPageNumber" as="span" compact />
              {': '}
              <span className="font-bangla text-foreground">{customer.memoPageNumberBn}</span>
            </p>
          </div>
        </Link>

        <details className="group rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <summary className="cursor-pointer list-none font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <TranslatedText translationKey="customer.list.moreDetails" as="span" compact />
          </summary>
          <dl className="mt-3 grid gap-2 border-t border-border/60 pt-3">
            <div>
              <dt className="text-xs text-muted-foreground">
                <TranslatedText translationKey="customer.field.fatherName" as="span" compact />
              </dt>
              <dd>
                <BilingualText
                  bn={customer.fatherNameBn}
                  en={customer.fatherNameEn}
                  mode={displayMode}
                  language={language}
                  layout="default"
                  as="span"
                  fallback={EMPTY_CELL_VALUE}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                <TranslatedText translationKey="customer.field.address" as="span" compact />
              </dt>
              <dd className="font-bangla">{truncateAddress(customer.addressBn)}</dd>
            </div>
            {hasMediator(customer) ? (
              <div>
                <dt className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="customer.field.mediatorName" as="span" compact />
                </dt>
                <dd>
                  <BilingualText
                    bn={customer.mediatorNameBn}
                    en={customer.mediatorNameEn}
                    mode={displayMode}
                    language={language}
                    layout="default"
                    as="span"
                  />
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted-foreground">
                <TranslatedText translationKey="customer.list.column.created" as="span" compact />
              </dt>
              <dd>{formatCustomerDate(customer.createdAt, language)}</dd>
            </div>
          </dl>
        </details>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={detailHref}>
              <TranslatedText translationKey="customer.actions.view" as="span" compact />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={editHref}>
              <TranslatedText translationKey="customer.actions.edit" as="span" compact />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
