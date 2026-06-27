import { API_ROUTES } from '../constants/routes';
import type {
  GenerateTemporaryPasswordResponse,
  StaffUser,
  StaffUserCreateRequest,
  StaffUserCreateResponse,
  StaffUserListParams,
  StaffUserResetPasswordResponse,
  StaffUserUpdateRequest,
} from '../types/admin-staff-user';
import type { Paginated } from '../types/customer';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(params?: StaffUserListParams): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.search !== undefined) query.search = params.search;
  if (params.status !== undefined) query.status = params.status;
  if (params.ordering !== undefined) query.ordering = params.ordering;

  return Object.keys(query).length > 0 ? query : undefined;
}

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminStaffUsersApi = {
  listStaffUsers(params?: StaffUserListParams): Promise<Paginated<StaffUser>> {
    return backendAdminApi.get<Paginated<StaffUser>>(API_ROUTES.adminStaffUsers.list, {
      params: toQueryParams(params),
    });
  },

  getStaffUser(id: number): Promise<StaffUser> {
    return backendAdminApi.get<StaffUser>(API_ROUTES.adminStaffUsers.detail(id));
  },

  async createStaffUser(body: StaffUserCreateRequest): Promise<StaffUserCreateResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<StaffUserCreateResponse, StaffUserCreateRequest>(
      API_ROUTES.adminStaffUsers.list,
      body,
    );
  },

  async updateStaffUser(id: number, body: StaffUserUpdateRequest): Promise<StaffUser> {
    await ensureCsrfForWrite();
    return backendAdminApi.patch<StaffUser, StaffUserUpdateRequest>(
      API_ROUTES.adminStaffUsers.detail(id),
      body,
    );
  },

  async generateTemporaryPassword(): Promise<GenerateTemporaryPasswordResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<GenerateTemporaryPasswordResponse>(
      API_ROUTES.adminStaffUsers.generateTempPassword,
    );
  },

  async resetTemporaryPassword(id: number): Promise<StaffUserResetPasswordResponse> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<StaffUserResetPasswordResponse>(
      API_ROUTES.adminStaffUsers.resetTempPassword(id),
    );
  },
};
