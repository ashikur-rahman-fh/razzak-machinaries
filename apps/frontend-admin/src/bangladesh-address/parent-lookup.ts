import { adminGeoApi } from '@razzak-machinaries/shared/api';

import { getGeoConfig } from './config';
import type { GeoResourceType, ParentLookupMap } from './types';

const MAX_PAGE_SIZE = 200;

async function fetchAllForLookup(type: GeoResourceType): Promise<ParentLookupMap> {
  const config = getGeoConfig(type);
  const map: ParentLookupMap = new Map();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await config.list({ page, pageSize: MAX_PAGE_SIZE, ordering: 'nameEn' });
    for (const item of response.results) {
      map.set(item.id, { nameEn: item.nameEn, nameBn: item.nameBn });
    }
    hasMore = response.next !== null;
    page += 1;
  }

  return map;
}

export async function loadParentLookup(
  type: GeoResourceType | undefined,
): Promise<ParentLookupMap> {
  if (!type) {
    return new Map();
  }
  return fetchAllForLookup(type);
}

export async function loadGeoStats(): Promise<{
  divisions: number;
  districts: number;
  upazilas: number;
  unions: number;
}> {
  const [divisions, districts, upazilas, unions] = await Promise.all([
    adminGeoApi.listDivisions({ page: 1, pageSize: 1 }),
    adminGeoApi.listDistricts({ page: 1, pageSize: 1 }),
    adminGeoApi.listUpazilas({ page: 1, pageSize: 1 }),
    adminGeoApi.listUnions({ page: 1, pageSize: 1 }),
  ]);

  return {
    divisions: divisions.count,
    districts: districts.count,
    upazilas: upazilas.count,
    unions: unions.count,
  };
}

export function getParentName(
  map: ParentLookupMap,
  parentId: number | undefined,
  language: 'en' | 'bn',
): string {
  if (parentId === undefined) {
    return '—';
  }
  const parent = map.get(parentId);
  if (!parent) {
    return String(parentId);
  }
  return language === 'bn' ? parent.nameBn : parent.nameEn;
}
