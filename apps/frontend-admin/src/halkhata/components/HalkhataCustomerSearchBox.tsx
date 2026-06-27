'use client';

import { adminCustomersApi, type Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { BilingualText, Input, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '../hooks';

type HalkhataCustomerSearchBoxProps = {
  disabled?: boolean;
  onSelect: (customer: Customer) => void;
};

export function HalkhataCustomerSearchBox({
  disabled = false,
  onSelect,
}: HalkhataCustomerSearchBoxProps) {
  const { language, displayMode, t } = useLanguagePreference();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [options, setOptions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (disabled) return undefined;
    let cancelled = false;

    async function load() {
      if (!debouncedSearch.trim()) {
        setOptions([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await adminCustomersApi.listCustomers({
          search: debouncedSearch,
          pageSize: 10,
          ordering: 'relevance',
          status: 'active',
        });
        if (!cancelled) {
          setOptions(response.results);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, disabled]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        <TranslatedText translationKey="halkhata.search.title" as="span" />
      </h2>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('halkhata.search.placeholder')}
        disabled={disabled}
        aria-label={t('halkhata.search.placeholder')}
        data-testid="halkhata-customer-search-input"
      />
      {debouncedSearch.trim() ? (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              <TranslatedText translationKey="halkhata.search.loading" as="span" compact />
            </p>
          ) : null}
          {!isLoading && options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              <TranslatedText translationKey="halkhata.search.empty" as="span" compact />
            </p>
          ) : null}
          {options.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="flex w-full flex-col items-start gap-1 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onSelect(customer)}
              disabled={disabled}
            >
              <BilingualText
                bn={customer.fullNameBn}
                en={customer.fullNameEn}
                language={language}
                mode={displayMode}
                className="font-medium"
              />
              <span className="text-sm text-muted-foreground">{customer.phone}</span>
              <BilingualText
                bn={customer.addressBn}
                en={customer.addressEn}
                language={language}
                mode={displayMode}
                className="text-sm text-muted-foreground"
              />
              <span className="text-sm font-medium tabular-nums">
                <TranslatedText translationKey="halkhata.search.due" as="span" compact />
                {': '}
                {formatBdt(customer.cachedBalance, language)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
