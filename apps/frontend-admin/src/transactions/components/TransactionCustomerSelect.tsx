'use client';

import { adminCustomersApi, type Customer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, Input, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '../hooks';

type TransactionCustomerSelectProps = {
  value: number | null;
  onChange: (customerId: number | null, customer?: Customer) => void;
  disabled?: boolean;
  error?: string;
  preselectedCustomer?: Customer | null;
};

export function TransactionCustomerSelect({
  value,
  onChange,
  disabled = false,
  error,
  preselectedCustomer = null,
}: TransactionCustomerSelectProps) {
  const { language, displayMode, t } = useLanguagePreference();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [options, setOptions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(preselectedCustomer);

  useEffect(() => {
    if (!preselectedCustomer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync preselected customer from parent
    setSelected(preselectedCustomer);
  }, [preselectedCustomer]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const response = await adminCustomersApi.listCustomers({
          search: debouncedSearch || undefined,
          pageSize: 10,
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
  }, [debouncedSearch]);

  useEffect(() => {
    if (!value) return;
    if (selected?.id === value) return;
    const fromOptions = options.find((item) => item.id === value);
    if (fromOptions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync selected customer from options
      setSelected(fromOptions);
      return;
    }
    let cancelled = false;
    void adminCustomersApi.getCustomer(value).then((customer) => {
      if (!cancelled) setSelected(customer);
    });
    return () => {
      cancelled = true;
    };
  }, [value, options, selected?.id]);

  function handleSelect(customer: Customer) {
    setSelected(customer);
    onChange(customer.id, customer);
    setSearch('');
  }

  function handleClear() {
    setSelected(null);
    onChange(null);
    setSearch('');
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor="transaction-customer-search">
        <TranslatedText translationKey="transaction.customer" as="span" compact />
      </label>

      {selected ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <BilingualText
              bn={selected.fullNameBn}
              en={selected.fullNameEn}
              language={language}
              mode={displayMode}
              className="font-medium"
            />
            <p className="mt-1 text-sm text-muted-foreground">{selected.phone}</p>
          </div>
          {!disabled ? (
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={handleClear}
            >
              {language === 'bn' ? 'পরিবর্তন' : 'Change'}
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <Input
            id="transaction-customer-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('transaction.create.selectCustomer')}
            disabled={disabled}
            aria-invalid={Boolean(error)}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              <TranslatedText translationKey={error} as="span" compact />
            </p>
          ) : null}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {isLoading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {language === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'}
              </p>
            ) : null}
            {!isLoading && options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {language === 'bn' ? 'কোনো গ্রাহক পাওয়া যায়নি।' : 'No customers found.'}
              </p>
            ) : null}
            {options.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                onClick={() => handleSelect(customer)}
              >
                <BilingualText
                  bn={customer.fullNameBn}
                  en={customer.fullNameEn}
                  language={language}
                  mode={displayMode}
                  className="font-medium"
                />
                <span className="text-xs text-muted-foreground">
                  {customer.phone} · {customer.memoPageNumberEn}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
