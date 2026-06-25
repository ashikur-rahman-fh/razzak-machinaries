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

export type CustomerListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
