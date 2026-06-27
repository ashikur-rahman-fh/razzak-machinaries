'use client';

import type { Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';

import { CustomerInfoRow } from '@/customers/components/CustomerInfoRow';
import { formatCustomerPhone } from '@/customers/utils';

type HalkhataPaymentCustomerSummaryProps = {
  customer: Customer;
};

export function HalkhataPaymentCustomerSummary({ customer }: HalkhataPaymentCustomerSummaryProps) {
  const { language } = useLanguagePreference();

  return (
    <div
      className="rounded-lg border border-border bg-muted/30 p-3"
      data-testid="halkhata-payment-customer-summary"
    >
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <CustomerInfoRow
          labelKey="customer.field.fullName"
          valueBn={customer.fullNameBn}
          valueEn={customer.fullNameEn}
        />
        <CustomerInfoRow
          labelKey="customer.field.mediatorName"
          valueBn={customer.mediatorNameBn}
          valueEn={customer.mediatorNameEn}
        />
        <CustomerInfoRow
          labelKey="customer.field.address"
          valueBn={customer.addressBn}
          valueEn={customer.addressEn}
        />
        <CustomerInfoRow labelKey="customer.field.phone" value={formatCustomerPhone(customer)} />
        <div className="sm:col-span-2">
          <CustomerInfoRow labelKey="halkhata.payment.dueLabel">
            <span className="font-medium tabular-nums">
              {formatBdt(customer.cachedBalance, language)}
            </span>
          </CustomerInfoRow>
        </div>
      </dl>
    </div>
  );
}
