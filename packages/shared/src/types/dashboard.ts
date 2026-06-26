import type { TransactionType } from './transaction';

export type DashboardSummary = {
  totalDue: string;
  currentMonthSales: string;
  currentMonthPayments: string;
  currentMonthNetDueChange: string;
  totalCustomers: number;
  totalTransactions: number;
};

export type DashboardRecentTransaction = {
  id: number;
  displayId: string;
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  transactionType: TransactionType;
  date: string;
  totalAmount: string;
  updatedAt: string;
};

export type DashboardRecentCustomer = {
  id: number;
  fullNameBn: string;
  fullNameEn: string;
  phone: string;
  addressBn: string;
  addressEn: string;
  currentBalance: string;
  updatedAt: string;
};

export type MonthlySalesPayments = {
  month: number;
  monthName: string;
  sales: string;
  payments: string;
};

export type MonthlyDueChange = {
  month: number;
  monthName: string;
  netDueChange: string;
};

export type MonthlyTransactionCounts = {
  month: number;
  monthName: string;
  salesCount: number;
  paymentsCount: number;
  initialCount: number;
};

export type TopCustomerByDue = {
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  currentBalance: string;
};

export type DashboardYearlyStats = {
  year: number;
  monthlySalesPayments: MonthlySalesPayments[];
  monthlyDueChange: MonthlyDueChange[];
  monthlyTransactionCounts: MonthlyTransactionCounts[];
  topCustomersByDue: TopCustomerByDue[];
  yearlySalesTotal: string;
  yearlyPaymentsTotal: string;
  availableYears: number[];
};

export type DashboardData = {
  summary: DashboardSummary;
  recentTransactions: DashboardRecentTransaction[];
  recentCustomers: DashboardRecentCustomer[];
  yearlyStats: DashboardYearlyStats;
};

export type DashboardParams = {
  year?: number;
};
