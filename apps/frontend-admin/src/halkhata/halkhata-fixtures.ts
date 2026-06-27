import type { Halkhata, HalkhataStats, HalkhataTransaction } from '@razzak-machinaries/shared/api';

export const sampleHalkhata: Halkhata = {
  id: 1,
  title: 'Summer Collection 2026',
  date: '2026-06-27',
  status: 'active',
  notes: 'Main shop collection day',
  createdByName: 'admin',
  createdAt: '2026-06-27T08:00:00Z',
  updatedAt: '2026-06-27T08:00:00Z',
  totalCollected: '1500.00',
  paymentCount: 3,
  stats: {
    totalCollected: '1500.00',
    paymentCount: 3,
    averagePayment: '500.00',
    highestPayment: '800.00',
    uniqueCustomersPaid: 2,
    todayCollection: '1500.00',
    remainingDueOfPaidCustomers: '2500.00',
  },
};

export const sampleHalkhataStats: HalkhataStats = sampleHalkhata.stats!;

export const sampleHalkhataTransactions: HalkhataTransaction[] = [
  {
    id: 101,
    displayId: 'COM-101',
    paymentNumber: 1,
    customerId: 42,
    customerNameBn: 'রহিম',
    customerNameEn: 'Rahim',
    customerPhone: '01711111111',
    totalAmount: '500.00',
    date: '2026-06-27',
    note: 'Partial payment',
    createdByName: 'admin',
    createdAt: '2026-06-27T09:00:00Z',
  },
];
