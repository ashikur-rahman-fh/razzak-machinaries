import {
  adminGeoApi,
  type GeoDistrict,
  type GeoDistrictWrite,
  type GeoDivision,
  type GeoDivisionWrite,
  type GeoListParams,
  type GeoUnion,
  type GeoUnionWrite,
  type GeoUpazila,
  type GeoUpazilaWrite,
  type GeoVillage,
  type GeoVillageWrite,
  type Paginated,
} from '@razzak-machinaries/shared/api';

import type { GeoResourceType } from './types';

export type GeoResourceConfig = {
  singularLabelKey: string;
  pluralLabelKey: string;
  list: (
    params?: GeoListParams,
  ) => Promise<Paginated<GeoDivision | GeoDistrict | GeoUpazila | GeoUnion | GeoVillage>>;
  get: (id: number) => Promise<GeoDivision | GeoDistrict | GeoUpazila | GeoUnion | GeoVillage>;
  update: (
    id: number,
    body: GeoDivisionWrite | GeoDistrictWrite | GeoUpazilaWrite | GeoUnionWrite | GeoVillageWrite,
  ) => Promise<GeoDivision | GeoDistrict | GeoUpazila | GeoUnion | GeoVillage>;
  delete: (id: number) => Promise<void>;
  parentFilterKey?: 'divisionId' | 'districtId' | 'upazilaId';
  parentResource?: GeoResourceType;
  parentIdField?: 'divisionId' | 'districtId' | 'upazilaId';
  hasParentOnEdit: boolean;
};

export const GEO_RESOURCE_CONFIG: Record<GeoResourceType, GeoResourceConfig> = {
  divisions: {
    singularLabelKey: 'geo.type.division',
    pluralLabelKey: 'geo.type.divisions',
    list: adminGeoApi.listDivisions,
    get: adminGeoApi.getDivision,
    update: adminGeoApi.updateDivision,
    delete: adminGeoApi.deleteDivision,
    hasParentOnEdit: false,
  },
  districts: {
    singularLabelKey: 'geo.type.district',
    pluralLabelKey: 'geo.type.districts',
    list: adminGeoApi.listDistricts,
    get: adminGeoApi.getDistrict,
    update: adminGeoApi.updateDistrict,
    delete: adminGeoApi.deleteDistrict,
    parentFilterKey: 'divisionId',
    parentResource: 'divisions',
    parentIdField: 'divisionId',
    hasParentOnEdit: true,
  },
  upazilas: {
    singularLabelKey: 'geo.type.upazila',
    pluralLabelKey: 'geo.type.upazilas',
    list: adminGeoApi.listUpazilas,
    get: adminGeoApi.getUpazila,
    update: adminGeoApi.updateUpazila,
    delete: adminGeoApi.deleteUpazila,
    parentFilterKey: 'districtId',
    parentResource: 'districts',
    parentIdField: 'districtId',
    hasParentOnEdit: true,
  },
  unions: {
    singularLabelKey: 'geo.type.union',
    pluralLabelKey: 'geo.type.unions',
    list: adminGeoApi.listUnions,
    get: adminGeoApi.getUnion,
    update: adminGeoApi.updateUnion,
    delete: adminGeoApi.deleteUnion,
    parentFilterKey: 'upazilaId',
    parentResource: 'upazilas',
    parentIdField: 'upazilaId',
    hasParentOnEdit: true,
  },
  villages: {
    singularLabelKey: 'geo.type.village',
    pluralLabelKey: 'geo.type.villages',
    list: adminGeoApi.listVillages,
    get: adminGeoApi.getVillage,
    update: adminGeoApi.updateVillage,
    delete: adminGeoApi.deleteVillage,
    hasParentOnEdit: false,
  },
};

export function getGeoConfig(type: GeoResourceType): GeoResourceConfig {
  return GEO_RESOURCE_CONFIG[type];
}
