'use client';

import type { HalkhataStats } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { Skeleton, TranslatedText } from '@razzak-machinaries/shared/ui';

type HalkhataStatsCardsProps = {
  stats: HalkhataStats | null;
  isLoading: boolean;
};

type StatItem = {
  key: string;
  labelKey: string;
  value: string | number | null;
};

function StatCard({
  labelKey,
  value,
  isLoading,
}: {
  labelKey: string;
  value: string | number | null;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">
        <TranslatedText translationKey={labelKey} as="span" compact />
      </p>
      <div className="mt-3">
        {isLoading || value === null ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

export function HalkhataStatsCards({ stats, isLoading }: HalkhataStatsCardsProps) {
  const { language } = useLanguagePreference();

  const items: StatItem[] = [
    {
      key: 'totalCollected',
      labelKey: 'halkhata.stats.totalCollected',
      value: stats ? formatBdt(stats.totalCollected, language) : null,
    },
    {
      key: 'paymentCount',
      labelKey: 'halkhata.stats.paymentCount',
      value: stats?.paymentCount ?? null,
    },
    {
      key: 'averagePayment',
      labelKey: 'halkhata.stats.averagePayment',
      value: stats ? formatBdt(stats.averagePayment, language) : null,
    },
    {
      key: 'highestPayment',
      labelKey: 'halkhata.stats.highestPayment',
      value: stats ? formatBdt(stats.highestPayment, language) : null,
    },
    {
      key: 'uniqueCustomers',
      labelKey: 'halkhata.stats.uniqueCustomers',
      value: stats?.uniqueCustomersPaid ?? null,
    },
    {
      key: 'todayCollection',
      labelKey: 'halkhata.stats.todayCollection',
      value: stats ? formatBdt(stats.todayCollection, language) : null,
    },
    {
      key: 'remainingDue',
      labelKey: 'halkhata.stats.remainingDue',
      value: stats ? formatBdt(stats.remainingDueOfPaidCustomers, language) : null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.key}
          labelKey={item.labelKey}
          value={item.value}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
