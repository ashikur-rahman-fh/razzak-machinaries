'use client';

import type { Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useMemo } from 'react';

import { readRecentCustomers, recentSnapshotToCustomer } from '../recent-customers';

type HalkhataRecentCustomersPanelProps = {
  halkhataId: number;
  disabled?: boolean;
  refreshSignal?: number;
  onSelect: (customer: Customer) => void;
};

export function HalkhataRecentCustomersPanel({
  halkhataId,
  disabled = false,
  refreshSignal = 0,
  onSelect,
}: HalkhataRecentCustomersPanelProps) {
  const { language, displayMode } = useLanguagePreference();
  const recentCustomers = useMemo(() => {
    void refreshSignal;
    return readRecentCustomers(halkhataId);
  }, [halkhataId, refreshSignal]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        <TranslatedText translationKey="halkhata.search.recentTitle" as="span" />
      </h2>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
        {recentCustomers.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            <TranslatedText translationKey="halkhata.search.recentEmpty" as="span" compact />
          </p>
        ) : (
          recentCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              data-testid={`halkhata-recent-customer-${customer.id}`}
              className="flex w-full items-center border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onSelect(recentSnapshotToCustomer(customer))}
              disabled={disabled}
            >
              <BilingualText
                bn={customer.fullNameBn}
                en={customer.fullNameEn}
                language={language}
                mode={displayMode}
                className="font-medium"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
