import { API_ROUTES } from '../constants/routes';
import type {
  HalkhataInvitationCustomerListParams,
  HalkhataInvitationGeneration,
  HalkhataInvitationGenerationDetail,
  HalkhataInvitationGenerationListParams,
  HalkhataInvitationGenerationWrite,
  HalkhataInvitationPageContext,
  InvitationCustomer,
  Paginated,
} from '../types/halkhata-invitation';
import { ensureAdminCsrf } from './admin-auth';
import { backendAdminApi } from './clients/backend-admin';

function toCustomerListParams(
  params?: HalkhataInvitationCustomerListParams,
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number | boolean> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.search !== undefined) query.search = params.search;
  if (params.address !== undefined) query.address = params.address;
  if (params.mediator !== undefined) query.mediator = params.mediator;
  if (params.hasDue !== undefined) query.hasDue = params.hasDue;
  if (params.ordering !== undefined) query.ordering = params.ordering;
  return Object.keys(query).length > 0 ? query : undefined;
}

function toGenerationListParams(
  params?: HalkhataInvitationGenerationListParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  if (params.page !== undefined) query.page = params.page;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  return Object.keys(query).length > 0 ? query : undefined;
}

async function ensureCsrfForWrite(): Promise<void> {
  await ensureAdminCsrf();
}

export const adminHalkhataInvitationsApi = {
  getInvitationPageContext(halkhataId: number): Promise<HalkhataInvitationPageContext> {
    return backendAdminApi.get<HalkhataInvitationPageContext>(
      API_ROUTES.adminHalkhatas.invitations(halkhataId),
    );
  },

  listInvitationCustomers(
    halkhataId: number,
    params?: HalkhataInvitationCustomerListParams,
  ): Promise<Paginated<InvitationCustomer>> {
    return backendAdminApi.get<Paginated<InvitationCustomer>>(
      API_ROUTES.adminHalkhatas.invitationCustomers(halkhataId),
      { params: toCustomerListParams(params) },
    );
  },

  listInvitationGenerations(
    halkhataId: number,
    params?: HalkhataInvitationGenerationListParams,
  ): Promise<Paginated<HalkhataInvitationGeneration>> {
    return backendAdminApi.get<Paginated<HalkhataInvitationGeneration>>(
      API_ROUTES.adminHalkhatas.invitationGenerations(halkhataId),
      { params: toGenerationListParams(params) },
    );
  },

  async createInvitationGeneration(
    halkhataId: number,
    body: HalkhataInvitationGenerationWrite,
  ): Promise<HalkhataInvitationGenerationDetail> {
    await ensureCsrfForWrite();
    return backendAdminApi.post<
      HalkhataInvitationGenerationDetail,
      HalkhataInvitationGenerationWrite
    >(API_ROUTES.adminHalkhatas.invitationGenerations(halkhataId), body);
  },

  getInvitationGeneration(
    halkhataId: number,
    generationId: number,
  ): Promise<HalkhataInvitationGenerationDetail> {
    return backendAdminApi.get<HalkhataInvitationGenerationDetail>(
      API_ROUTES.adminHalkhatas.invitationGenerationDetail(halkhataId, generationId),
    );
  },
};
