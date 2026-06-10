'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Skeleton,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';

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
];

export function BangladeshAddressStatsCards({
  stats,
  isLoading,
  error,
  onRetry,
}: BangladeshAddressStatsCardsProps) {
  if (error) {
    return (
      <div className="space-y-3">
        <ErrorState
          message={<TranslatedText translationKey="geo.list.loadError" as="span" layout="inline" />}
        />
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <TranslatedText translationKey="geo.list.retry" as="span" compact />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="geo-stats-cards">
      {STAT_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TranslatedText translationKey={item.labelKey} as="span" layout="inline" compact />
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
