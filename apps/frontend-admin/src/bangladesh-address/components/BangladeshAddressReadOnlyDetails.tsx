'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  BilingualText,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';

import { getGeoConfig } from '../config';
import type { GeoRecord, GeoResourceType, ParentLookupMap } from '../types';

type BangladeshAddressReadOnlyDetailsProps = {
  geoType: GeoResourceType;
  record: GeoRecord;
  parentLookup: ParentLookupMap;
};

function DetailFieldLabel({ translationKey }: { translationKey: string }) {
  return (
    <dt className="font-medium text-muted-foreground">
      <TranslatedText translationKey={translationKey} as="span" layout="inline" compact />
    </dt>
  );
}

function ParentNameValue({
  parentLookup,
  parentId,
  language,
  displayMode,
}: {
  parentLookup: ParentLookupMap;
  parentId: number;
  language: 'en' | 'bn';
  displayMode: 'en' | 'bn' | 'both';
}) {
  const parent = parentLookup.get(parentId);
  if (!parent) {
    return <TranslatedText translationKey="geo.value.notAvailable" as="span" layout="inline" />;
  }
  return (
    <BilingualText
      en={parent.nameEn}
      bn={parent.nameBn}
      mode={displayMode}
      language={language}
      as="span"
    />
  );
}

export function BangladeshAddressReadOnlyDetails({
  geoType,
  record,
  parentLookup,
}: BangladeshAddressReadOnlyDetailsProps) {
  const { language, displayMode } = useLanguagePreference();
  const config = getGeoConfig(geoType);

  const parentId =
    geoType === 'districts' && 'divisionId' in record
      ? record.divisionId
      : geoType === 'upazilas' && 'districtId' in record
        ? record.districtId
        : geoType === 'unions' && 'upazilaId' in record
          ? record.upazilaId
          : undefined;

  const parentLabelKey =
    config.parentIdField === 'divisionId'
      ? 'geo.field.division'
      : config.parentIdField === 'districtId'
        ? 'geo.field.district'
        : config.parentIdField === 'upazilaId'
          ? 'geo.field.upazila'
          : undefined;

  const parentSourceIdLabelKey =
    config.parentIdField === 'divisionId'
      ? 'geo.field.divisionSourceId'
      : config.parentIdField === 'districtId'
        ? 'geo.field.districtSourceId'
        : config.parentIdField === 'upazilaId'
          ? 'geo.field.upazilaSourceId'
          : undefined;

  return (
    <Card data-testid="geo-readonly-details">
      <CardHeader>
        <CardTitle>
          <TranslatedText translationKey="geo.detail.placeDetails" as="span" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 text-sm">
          <div className="grid gap-1">
            <DetailFieldLabel translationKey="geo.field.sourceId" />
            <dd className="font-mono">{record.id}</dd>
          </div>
          {parentLabelKey && parentId !== undefined ? (
            <>
              <div className="grid gap-1">
                <DetailFieldLabel translationKey={parentLabelKey} />
                <dd>
                  <ParentNameValue
                    parentLookup={parentLookup}
                    parentId={parentId}
                    language={language}
                    displayMode={displayMode}
                  />
                </dd>
              </div>
              {parentSourceIdLabelKey ? (
                <div className="grid gap-1">
                  <DetailFieldLabel translationKey={parentSourceIdLabelKey} />
                  <dd className="font-mono">{parentId}</dd>
                </div>
              ) : null}
            </>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
