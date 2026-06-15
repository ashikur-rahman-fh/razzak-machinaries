import { API_ROUTES } from '../constants/routes';
import type {
  GeoDistrict,
  GeoDivision,
  GeoUnion,
  GeoUpazila,
  GeoVillage,
  GeoListParams,
  Paginated,
} from '../types/geo';
import { backendMainApi } from './clients/backend-main';

export async function getDivisions(): Promise<GeoDivision[]> {
  return backendMainApi.get<GeoDivision[]>(API_ROUTES.publicGeo.divisions);
}

export async function getDistricts(divisionId: number): Promise<GeoDistrict[]> {
  return backendMainApi.get<GeoDistrict[]>(API_ROUTES.publicGeo.districts, {
    params: { divisionId },
  });
}

export async function getUpazilas(districtId: number): Promise<GeoUpazila[]> {
  return backendMainApi.get<GeoUpazila[]>(API_ROUTES.publicGeo.upazilas, {
    params: { districtId },
  });
}

export async function getUnions(upazilaId: number): Promise<GeoUnion[]> {
  return backendMainApi.get<GeoUnion[]>(API_ROUTES.publicGeo.unions, {
    params: { upazilaId },
  });
}

export async function getVillages(params?: GeoListParams): Promise<Paginated<GeoVillage>> {
  const query: Record<string, string | number> = {};
  if (params?.page !== undefined) query.page = params.page;
  if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params?.search !== undefined) query.search = params.search;
  if (params?.ordering !== undefined) query.ordering = params.ordering;

  return backendMainApi.get<Paginated<GeoVillage>>(API_ROUTES.publicGeo.villages, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
}
