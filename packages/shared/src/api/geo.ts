import { API_ROUTES } from '../constants/routes';
import type { GeoDistrict, GeoDivision, GeoUnion, GeoUpazila } from '../types/geo';
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
