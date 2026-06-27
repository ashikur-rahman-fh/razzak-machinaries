export type FollowUpStatus = 'pending' | 'completed' | 'rescheduled' | 'cancelled';

export interface CustomerFollowUp {
  id: number;
  customerId: number;
  followUpDate: string;
  status: FollowUpStatus;
  note: string;
  completionNote: string;
  assignedToId: number | null;
  assignedToName: string | null;
  createdById: number | null;
  createdByName: string | null;
  completedById: number | null;
  completedByName: string | null;
  completedAt: string | null;
  rescheduledFromId: number | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isToday: boolean;
}

export interface CustomerFollowUpsResponse {
  active: CustomerFollowUp | null;
  history: CustomerFollowUp[];
}

export interface CustomerFollowUpWrite {
  followUpDate: string;
  note?: string;
  assignedToId?: number | null;
}

export interface CustomerFollowUpUpdate {
  followUpDate?: string;
  note?: string;
  assignedToId?: number | null;
}

export interface CustomerFollowUpCompleteWrite {
  completionNote?: string;
}

export interface DashboardFollowUpCustomer {
  id: number;
  fullNameBn: string;
  fullNameEn: string;
  phone: string;
  addressBn: string;
  addressEn: string;
  currentBalance: string;
}

export interface DashboardFollowUpItem {
  id: number;
  followUpDate: string;
  isOverdue: boolean;
  isToday: boolean;
  note: string;
  assignedToName: string | null;
  createdByName: string | null;
  customer: DashboardFollowUpCustomer;
}

export interface DashboardFollowUpsResponse {
  items: DashboardFollowUpItem[];
}

export interface DashboardFollowUpsParams {
  asOf?: string;
}
