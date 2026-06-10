'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { Badge, Button, TranslatedText } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { getGeoConfig } from '../config';
import type { GeoResourceType } from '../types';

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

type BangladeshAddressDetailHeaderProps = {
  geoType: GeoResourceType;
  nameEn: string;
  sourceId: number;
  backHref: string;
  actions?: ReactNode;
};

export function BangladeshAddressDetailHeader({
  geoType,
  nameEn,
  sourceId,
  backHref,
  actions,
}: BangladeshAddressDetailHeaderProps) {
  const { t } = useLanguagePreference();
  const config = getGeoConfig(geoType);
  const typeLabel = t(config.singularLabelKey);
  const subtitle = interpolate(t('geo.detail.sourceIdSubtitle'), {
    type: typeLabel,
    id: String(sourceId),
  });

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      data-testid="geo-detail-header"
    >
      <div className="flex flex-col gap-3">
        <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
          <Link href={backHref}>
            <TranslatedText translationKey="geo.actions.backToList" as="span" compact />
          </Link>
        </Button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {nameEn}
            </h1>
            <Badge variant="secondary">
              <TranslatedText translationKey={config.singularLabelKey} as="span" compact />
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
