export type Customer = {
  id: number;
  fullNameBn: string;
  fullNameEn: string;
  addressBn: string;
  addressEn: string;
  phoneBn: string;
  phoneEn: string;
  phone: string;
  fatherNameBn: string;
  fatherNameEn: string;
  memoPageNumberBn: string;
  memoPageNumberEn: string;
  mediatorNameBn: string;
  mediatorNameEn: string;
  profilePictureUrl: string | null;
  cachedBalance: string;
  isArchived: boolean;
  archivedAt: string | null;
  archiveReason: string;
  archivedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerWrite = {
  fullNameBn: string;
  fullNameEn: string;
  addressBn: string;
  addressEn: string;
  phoneBn: string;
  phoneEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  memoPageNumberBn: string;
  memoPageNumberEn: string;
  mediatorNameBn?: string;
  mediatorNameEn?: string;
};

export type CustomerVersionWrite = CustomerWrite & {
  changeReason?: string;
};

export type CustomerVersion = {
  id: number;
  versionNumber: number;
  isCurrent: boolean;
  previousVersionId: number | null;
  fullNameBn: string;
  fullNameEn: string;
  addressBn: string;
  addressEn: string;
  phoneBn: string;
  phoneEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  memoPageNumberBn: string;
  memoPageNumberEn: string;
  mediatorNameBn: string;
  mediatorNameEn: string;
  profilePictureUrl: string | null;
  changeReason: string;
  createdByName: string | null;
  createdAt: string;
};

export type CustomerVersionResponse = {
  customer: Customer;
  version: CustomerVersion;
  message: string;
};

export type CustomerArchiveWrite = {
  archiveReason: string;
};

export type CustomerArchiveResponse = {
  customer: Customer;
  message: string;
};

export type CustomerHistory = {
  customerId: number;
  versions: CustomerVersion[];
};

export type CustomerListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  status?: 'active' | 'archived' | 'all';
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
