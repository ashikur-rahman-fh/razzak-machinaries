export type TransactionType = 'INITIAL' | 'SALE' | 'PAYMENT';

export type PaymentMethod = 'cash' | 'bank' | 'bkash' | 'nagad' | 'other';

export type TransactionItem = {
  id: number;
  productName: string;
  unitPrice: string;
  quantity: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: number;
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  transactionType: TransactionType;
  date: string;
  amount: string;
  totalAmount: string;
  note: string;
  paymentMethod: string;
  balanceImpact: string;
  items: TransactionItem[];
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionItemWrite = {
  productName: string;
  unitPrice: string;
  quantity: string;
};

export type TransactionWrite = {
  customerId: number;
  transactionType: TransactionType;
  date: string;
  note?: string;
  paymentMethod?: PaymentMethod | '';
  amount?: string | null;
  items?: TransactionItemWrite[];
};

export type TransactionListParams = {
  page?: number;
  pageSize?: number;
  customerId?: number;
  transactionType?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  ordering?: string;
};

export type CustomerBalance = {
  customerId: number;
  currentBalance: string;
  totalInitial: string;
  totalSales: string;
  totalPayments: string;
  transactionCount: number;
  cachedBalance: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
