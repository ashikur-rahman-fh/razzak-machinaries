export type StaffUser = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  mustChangePassword: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdByName: string | null;
  updatedByName: string | null;
};

export type StaffUserCreateRequest = {
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  temporaryPassword?: string;
};

export type StaffUserCreateResponse = StaffUser & {
  temporaryPassword?: string;
};

export type StaffUserUpdateRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

export type StaffUserListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'inactive';
  ordering?: string;
};

export type GenerateTemporaryPasswordResponse = {
  temporaryPassword: string;
};

export type StaffUserResetPasswordResponse = StaffUser & {
  temporaryPassword: string;
};
