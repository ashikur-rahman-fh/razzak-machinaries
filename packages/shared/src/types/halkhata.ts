import type { Paginated } from './geo';
import type { PaymentMethod } from './transaction';

export type HalkhataStatus = 'active' | 'closed';

export type HalkhataStats = {
  totalCollected: string;
  paymentCount: number;
  averagePayment: string;
  highestPayment: string;
  uniqueCustomersPaid: number;
  todayCollection: string;
  remainingDueOfPaidCustomers: string;
};

export type Halkhata = {
  id: number;
  title: string;
  date: string;
  status: HalkhataStatus;
  notes: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  totalCollected: string;
  paymentCount: number;
  stats?: HalkhataStats;
};

export type HalkhataWrite = {
  title: string;
  date: string;
  notes?: string;
};

export type HalkhataUpdate = {
  notes?: string;
  status?: HalkhataStatus;
};

export type HalkhataPaymentWrite = {
  customerId: number;
  amount: string;
  date: string;
  note?: string;
  paymentMethod?: PaymentMethod | '';
};

export type HalkhataTransaction = {
  id: number;
  displayId: string;
  paymentNumber: number;
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  customerPhone: string;
  totalAmount: string;
  date: string;
  note: string;
  createdByName: string | null;
  createdAt: string;
};

export type HalkhataListParams = {
  page?: number;
  pageSize?: number;
  status?: HalkhataStatus;
};

export type HalkhataTransactionListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

export type { Paginated };
