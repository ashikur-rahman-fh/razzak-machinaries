import { API_ROUTES } from '../constants/routes';
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
  Paginated,
} from '../types/geo';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(params?: GeoListParams): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.search !== undefined) query.search = params.search;
  if (params.ordering !== undefined) query.ordering = params.ordering;
  if (params.divisionId !== undefined) query.divisionId = params.divisionId;
  if (params.districtId !== undefined) query.districtId = params.districtId;
  if (params.upazilaId !== undefined) query.upazilaId = params.upazilaId;

  return Object.keys(query).length > 0 ? query : undefined;
}

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminGeoApi = {
  listDivisions(params?: GeoListParams): Promise<Paginated<GeoDivision>> {
    return backendAdminApi.get<Paginated<GeoDivision>>(API_ROUTES.adminGeo.divisions, {
      params: toQueryParams(params),
    });
  },

  async createDivision(body: GeoDivisionWrite): Promise<GeoDivision> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<GeoDivision, GeoDivisionWrite>(API_ROUTES.adminGeo.divisions, body);
  },

  getDivision(id: number): Promise<GeoDivision> {
    return backendAdminApi.get<GeoDivision>(API_ROUTES.adminGeo.divisionDetail(id));
  },

  async updateDivision(id: number, body: GeoDivisionWrite): Promise<GeoDivision> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<GeoDivision, GeoDivisionWrite>(
      API_ROUTES.adminGeo.divisionDetail(id),
      body,
    );
  },

  async deleteDivision(id: number): Promise<void> {
    await ensureCsrfForWrite();
    await backendAdminApi.delete<void>(API_ROUTES.adminGeo.divisionDetail(id));
  },

  listDistricts(params?: GeoListParams): Promise<Paginated<GeoDistrict>> {
    return backendAdminApi.get<Paginated<GeoDistrict>>(API_ROUTES.adminGeo.districts, {
      params: toQueryParams(params),
    });
  },

  async createDistrict(body: GeoDistrictWrite): Promise<GeoDistrict> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<GeoDistrict, GeoDistrictWrite>(API_ROUTES.adminGeo.districts, body);
  },

  getDistrict(id: number): Promise<GeoDistrict> {
    return backendAdminApi.get<GeoDistrict>(API_ROUTES.adminGeo.districtDetail(id));
  },

  async updateDistrict(id: number, body: GeoDistrictWrite): Promise<GeoDistrict> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<GeoDistrict, GeoDistrictWrite>(
      API_ROUTES.adminGeo.districtDetail(id),
      body,
    );
  },

  async deleteDistrict(id: number): Promise<void> {
    await ensureCsrfForWrite();
    await backendAdminApi.delete<void>(API_ROUTES.adminGeo.districtDetail(id));
  },

  listUpazilas(params?: GeoListParams): Promise<Paginated<GeoUpazila>> {
    return backendAdminApi.get<Paginated<GeoUpazila>>(API_ROUTES.adminGeo.upazilas, {
      params: toQueryParams(params),
    });
  },

  async createUpazila(body: GeoUpazilaWrite): Promise<GeoUpazila> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<GeoUpazila, GeoUpazilaWrite>(API_ROUTES.adminGeo.upazilas, body);
  },

  getUpazila(id: number): Promise<GeoUpazila> {
    return backendAdminApi.get<GeoUpazila>(API_ROUTES.adminGeo.upazilaDetail(id));
  },

  async updateUpazila(id: number, body: GeoUpazilaWrite): Promise<GeoUpazila> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<GeoUpazila, GeoUpazilaWrite>(
      API_ROUTES.adminGeo.upazilaDetail(id),
      body,
    );
  },

  async deleteUpazila(id: number): Promise<void> {
    await ensureCsrfForWrite();
    await backendAdminApi.delete<void>(API_ROUTES.adminGeo.upazilaDetail(id));
  },

  listUnions(params?: GeoListParams): Promise<Paginated<GeoUnion>> {
    return backendAdminApi.get<Paginated<GeoUnion>>(API_ROUTES.adminGeo.unions, {
      params: toQueryParams(params),
    });
  },

  async createUnion(body: GeoUnionWrite): Promise<GeoUnion> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<GeoUnion, GeoUnionWrite>(API_ROUTES.adminGeo.unions, body);
  },

  getUnion(id: number): Promise<GeoUnion> {
    return backendAdminApi.get<GeoUnion>(API_ROUTES.adminGeo.unionDetail(id));
  },

  async updateUnion(id: number, body: GeoUnionWrite): Promise<GeoUnion> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<GeoUnion, GeoUnionWrite>(
      API_ROUTES.adminGeo.unionDetail(id),
      body,
    );
  },

  async deleteUnion(id: number): Promise<void> {
    await ensureCsrfForWrite();
    await backendAdminApi.delete<void>(API_ROUTES.adminGeo.unionDetail(id));
  },
};
