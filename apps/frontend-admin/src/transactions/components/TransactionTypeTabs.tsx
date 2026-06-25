'use client';

import type { TransactionType } from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import { Tabs, TabsList, TabsTrigger } from '@razzak-machinaries/shared/ui';

import { TRANSACTION_TYPE_LABEL_KEYS } from '../constants';

type TransactionTypeTabsProps = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
};

const TAB_VALUES: TransactionType[] = ['INITIAL', 'SALE', 'PAYMENT'];

export function TransactionTypeTabs({ value, onChange }: TransactionTypeTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as TransactionType)}
      className="w-full"
    >
      <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
        {TAB_VALUES.map((type) => (
          <TabsTrigger
            key={type}
            value={type}
            className="rounded-lg border border-border bg-background px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
          >
            {t(TRANSACTION_TYPE_LABEL_KEYS[type])}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
