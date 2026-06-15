export type GeoArea = {
  id: number;
  nameEn: string;
  nameBn: string;
};

export type GeoDivision = GeoArea;
export type GeoDistrict = GeoArea & { divisionId: number };
export type GeoUpazila = GeoArea & { districtId: number };
export type GeoUnion = GeoArea & { upazilaId: number };
export type GeoVillage = GeoArea;

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type GeoListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
};

export type GeoDivisionWrite = {
  id?: number;
  nameEn?: string;
  nameBn?: string;
};

export type GeoDistrictWrite = GeoDivisionWrite & {
  divisionId?: number;
};

export type GeoUpazilaWrite = GeoDivisionWrite & {
  districtId?: number;
};

export type GeoUnionWrite = GeoDivisionWrite & {
  upazilaId?: number;
};

export type GeoVillageWrite = GeoDivisionWrite;

export type VillageImportError = {
  rowIndex: number;
  message: string;
};

export type VillageImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  wouldCreate: number;
  wouldUpdate: number;
  errors: VillageImportError[];
};
