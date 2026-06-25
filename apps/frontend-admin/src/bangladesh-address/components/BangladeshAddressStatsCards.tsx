'use client';

import { RecoverableErrorState, Skeleton, TranslatedText } from '@razzak-machinaries/shared/ui';

import type { GeoStats } from '../types';

type BangladeshAddressStatsCardsProps = {
  stats: GeoStats | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
};

const STAT_ITEMS = [
  { key: 'divisions' as const, labelKey: 'geo.stats.divisions' },
  { key: 'districts' as const, labelKey: 'geo.stats.districts' },
  { key: 'upazilas' as const, labelKey: 'geo.stats.upazilas' },
  { key: 'unions' as const, labelKey: 'geo.stats.unions' },
  { key: 'villages' as const, labelKey: 'geo.stats.villages' },
];

function StatPill({
  labelKey,
  value,
  isLoading,
  testId,
}: {
  labelKey: string;
  value: number | undefined;
  isLoading: boolean;
  testId: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
      data-testid={testId}
    >
      <span className="text-xs text-muted-foreground">
        <TranslatedText translationKey={labelKey} as="span" layout="inline" compact />
      </span>
      {isLoading || value === undefined ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <span className="text-sm font-semibold tabular-nums">{value.toLocaleString()}</span>
      )}
    </div>
  );
}

export function BangladeshAddressStatsCards({
  stats,
  isLoading,
  error,
  onRetry,
}: BangladeshAddressStatsCardsProps) {
  if (error) {
    return (
      <RecoverableErrorState
        message={<TranslatedText translationKey="geo.list.loadError" as="span" layout="inline" />}
        onRetry={onRetry}
        retryLabel={<TranslatedText translationKey="geo.list.retry" as="span" compact />}
      />
    );
  }

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
        data-testid="geo-stats-cards-compact"
      >
        {STAT_ITEMS.map((item) => (
          <StatPill
            key={item.key}
            labelKey={item.labelKey}
            value={stats?.[item.key]}
            isLoading={isLoading || !stats}
            testId={`geo-stat-compact-${item.key}`}
          />
        ))}
      </div>

      <div
        className="hidden gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-5"
        data-testid="geo-stats-cards"
      >
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">
              <TranslatedText translationKey={item.labelKey} as="span" layout="inline" compact />
            </p>
            <div className="mt-2">
              {isLoading || !stats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p
                  className="text-2xl font-semibold tabular-nums"
                  data-testid={`geo-stat-${item.key}`}
                >
                  {stats[item.key].toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
