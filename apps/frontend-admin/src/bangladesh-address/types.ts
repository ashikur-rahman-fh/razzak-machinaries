import type {
  GeoDistrict,
  GeoDistrictWrite,
  GeoDivision,
  GeoDivisionWrite,
  GeoListParams,
  GeoUnion,
  GeoUnionWrite,
  GeoUpazila,
  GeoUpazilaWrite,
  GeoVillage,
  GeoVillageWrite,
  Paginated,
} from '@razzak-machinaries/shared/api';

export const GEO_RESOURCE_TYPES = [
  'divisions',
  'districts',
  'upazilas',
  'unions',
  'villages',
] as const;

export type GeoResourceType = (typeof GEO_RESOURCE_TYPES)[number];

export type GeoRecord = GeoDivision | GeoDistrict | GeoUpazila | GeoUnion | GeoVillage;

export type GeoWritePayload =
  | GeoDivisionWrite
  | GeoDistrictWrite
  | GeoUpazilaWrite
  | GeoUnionWrite
  | GeoVillageWrite;

export type GeoListState = {
  type: GeoResourceType;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
};

export type GeoStats = {
  divisions: number;
  districts: number;
  upazilas: number;
  unions: number;
  villages: number;
};

export type ParentLookupMap = Map<number, { nameEn: string; nameBn: string }>;

export type ListFn = (params?: GeoListParams) => Promise<Paginated<GeoRecord>>;

export function isGeoResourceType(value: string): value is GeoResourceType {
  return (GEO_RESOURCE_TYPES as readonly string[]).includes(value);
}

export function getParentId(record: GeoRecord, type: GeoResourceType): number | undefined {
  if (type === 'districts' && 'divisionId' in record) {
    return record.divisionId;
  }
  if (type === 'upazilas' && 'districtId' in record) {
    return record.districtId;
  }
  if (type === 'unions' && 'upazilaId' in record) {
    return record.upazilaId;
  }
  return undefined;
}
