import type { HalkhataStatus } from './halkhata';
import type { Paginated } from './geo';

export type HalkhataInvitationSelectionMode = 'manual' | 'all_active' | 'due_only';

export type HalkhataInvitationPageContext = {
  halkhataId: number;
  halkhataTitle: string;
  halkhataDate: string;
  halkhataStatus: HalkhataStatus;
  totalActiveCustomers: number;
  totalDueCustomers: number;
  canGenerate: boolean;
  generationCount: number;
  latestGenerationId: number | null;
};

export type InvitationCustomer = {
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
  cachedBalance: string;
};

export type HalkhataInvitationCustomerListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  address?: string;
  mediator?: string;
  hasDue?: boolean;
  ordering?: string;
};

export type HalkhataInvitationGeneration = {
  id: number;
  generatedByName: string | null;
  generatedAt: string;
  customerSelectionMode: HalkhataInvitationSelectionMode;
  customerCount: number;
  selectedCustomerIds: number[];
  status: 'generated';
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type HalkhataInvitationRecipientSnapshot = {
  customerId: number;
  customerNameSnapshot: string;
  phoneSnapshot: string;
  addressSnapshot: string;
  fatherNameSnapshot: string;
  dueAmountSnapshot: string;
  memoPageNumberSnapshot: string;
  sortOrder: number;
};

export type HalkhataInvitationGenerationDetail = HalkhataInvitationGeneration & {
  halkhataId: number;
  halkhataTitle: string;
  halkhataDate: string;
  recipients: HalkhataInvitationRecipientSnapshot[];
};

export type HalkhataInvitationGenerationWrite = {
  selectionMode: HalkhataInvitationSelectionMode;
  customerIds?: number[];
  notes?: string;
};

export type HalkhataInvitationGenerationListParams = {
  page?: number;
  pageSize?: number;
};

export type { Paginated };
