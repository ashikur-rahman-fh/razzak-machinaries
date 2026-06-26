'use client';

import type { DashboardData } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import { Skeleton, TranslatedText, cn } from '@razzak-machinaries/shared/ui';
import type { ReactNode } from 'react';

type DashboardKpiCardsProps = {
  summary: DashboardData['summary'] | null;
  yearlyStats: DashboardData['yearlyStats'] | null;
  isLoading: boolean;
};

type KpiItem = {
  key: string;
  labelKey: string;
  value: string | number | null;
  icon: ReactNode | null;
  hintKey?: string;
  valueClassName?: string;
};

function KpiCard({
  labelKey,
  value,
  icon,
  isLoading,
  hintKey,
  valueClassName,
  testId,
}: {
  labelKey: string;
  value: string | number | null;
  icon: ReactNode | null;
  isLoading: boolean;
  hintKey?: string;
  valueClassName?: string;
  testId: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          <TranslatedText translationKey={labelKey} as="span" layout="inline" compact />
        </p>
        {icon ? (
          <div className="rounded-md bg-muted p-2 text-muted-foreground" aria-hidden>
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3">
        {isLoading || value === null ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={cn('text-2xl font-semibold tabular-nums', valueClassName)}>{value}</p>
        )}
        {hintKey ? (
          <p className="mt-1 text-xs text-muted-foreground">
            <TranslatedText translationKey={hintKey} as="span" layout="inline" compact />
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardKpiCards({ summary, yearlyStats, isLoading }: DashboardKpiCardsProps) {
  const { language } = useLanguagePreference();

  const netChange = summary ? Number(summary.currentMonthNetDueChange) : 0;
  const netHintKey =
    netChange > 0
      ? 'dashboard.kpi.dueIncreased'
      : netChange < 0
        ? 'dashboard.kpi.dueDecreased'
        : undefined;
  const netValueClassName =
    netChange > 0
      ? 'text-amber-700 dark:text-amber-400'
      : netChange < 0
        ? 'text-emerald-700 dark:text-emerald-400'
        : undefined;

  const items: KpiItem[] = [
    {
      key: 'totalDue',
      labelKey: 'dashboard.kpi.totalDue',
      value: summary ? formatBdt(summary.totalDue, language) : null,
      icon: null,
    },
    {
      key: 'monthSales',
      labelKey: 'dashboard.kpi.monthSales',
      value: summary ? formatBdt(summary.currentMonthSales, language) : null,
      icon: null,
    },
    {
      key: 'monthPayments',
      labelKey: 'dashboard.kpi.monthPayments',
      value: summary ? formatBdt(summary.currentMonthPayments, language) : null,
      icon: null,
    },
    {
      key: 'netDueChange',
      labelKey: 'dashboard.kpi.netDueChange',
      value: summary ? formatBdt(summary.currentMonthNetDueChange, language) : null,
      icon: null,
      hintKey: netHintKey,
      valueClassName: netValueClassName,
    },
    {
      key: 'totalCustomers',
      labelKey: 'dashboard.kpi.totalCustomers',
      value: summary
        ? summary.totalCustomers.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')
        : null,
      icon: null,
    },
    {
      key: 'totalTransactions',
      labelKey: 'dashboard.kpi.totalTransactions',
      value: summary
        ? summary.totalTransactions.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')
        : null,
      icon: null,
    },
    {
      key: 'yearSales',
      labelKey: 'dashboard.kpi.yearSales',
      value: yearlyStats ? formatBdt(yearlyStats.yearlySalesTotal, language) : null,
      icon: null,
    },
    {
      key: 'yearPayments',
      labelKey: 'dashboard.kpi.yearPayments',
      value: yearlyStats ? formatBdt(yearlyStats.yearlyPaymentsTotal, language) : null,
      icon: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-kpi-cards">
      {items.map((item) => (
        <KpiCard
          key={item.key}
          labelKey={item.labelKey}
          value={item.value}
          icon={item.icon}
          isLoading={isLoading}
          hintKey={item.hintKey}
          valueClassName={item.valueClassName}
          testId={`dashboard-kpi-${item.key}`}
        />
      ))}
    </div>
  );
}
