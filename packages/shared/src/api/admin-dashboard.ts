import { API_ROUTES } from '../constants/routes';
import type { DashboardData, DashboardParams } from '../types/dashboard';
import { backendAdminApi } from './clients/backend-admin';

function toQueryParams(params?: DashboardParams): Record<string, number> | undefined {
  if (params?.year === undefined) {
    return undefined;
  }
  return { year: params.year };
}

export const adminDashboardApi = {
  getDashboard(params?: DashboardParams): Promise<DashboardData> {
    return backendAdminApi.get<DashboardData>(API_ROUTES.adminDashboard, {
      params: toQueryParams(params),
    });
  },
};
