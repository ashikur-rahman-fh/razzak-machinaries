'use client';

import { Tabs, TabsList, TabsTrigger, TranslatedText } from '@razzak-machinaries/shared/ui';

import { GEO_RESOURCE_TYPES, type GeoResourceType } from '../types';

type BangladeshAddressTypeTabsProps = {
  activeType: GeoResourceType;
  onTypeChange: (type: GeoResourceType) => void;
};

const TYPE_LABEL_KEYS: Record<GeoResourceType, string> = {
  divisions: 'geo.type.divisions',
  districts: 'geo.type.districts',
  upazilas: 'geo.type.upazilas',
  unions: 'geo.type.unions',
  villages: 'geo.type.villages',
};

export function BangladeshAddressTypeTabs({
  activeType,
  onTypeChange,
}: BangladeshAddressTypeTabsProps) {
  return (
    <Tabs
      value={activeType}
      onValueChange={(value) => onTypeChange(value as GeoResourceType)}
      data-testid="geo-type-tabs"
    >
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
        {GEO_RESOURCE_TYPES.map((type) => (
          <TabsTrigger key={type} value={type} className="px-4">
            <TranslatedText
              translationKey={TYPE_LABEL_KEYS[type]}
              as="span"
              layout="inline"
              compact
            />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
