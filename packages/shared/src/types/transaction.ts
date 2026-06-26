export type TransactionType = 'INITIAL' | 'SALE' | 'PAYMENT';

export type TransactionStatus = 'ACTIVE' | 'SUPERSEDED' | 'VOIDED';

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
  displayId: string;
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  customerNameSnapshotBn: string;
  customerNameSnapshotEn: string;
  customerAddressSnapshotBn: string;
  customerAddressSnapshotEn: string;
  customerPhoneSnapshot: string;
  transactionType: TransactionType;
  date: string;
  amount: string;
  totalAmount: string;
  note: string;
  paymentMethod: string;
  status: TransactionStatus;
  isCurrent: boolean;
  versionNumber: number;
  rootTransactionId: number | null;
  previousVersionId: number | null;
  editedFromId: number | null;
  nextVersionId: number | null;
  latestVersionId: number;
  editReason: string;
  editedByName: string | null;
  editedAt: string | null;
  voidReason: string;
  voidedByName: string | null;
  voidedAt: string | null;
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

export type TransactionCorrectionWrite = {
  transactionType?: TransactionType;
  date?: string;
  note?: string;
  paymentMethod?: PaymentMethod | '';
  amount?: string | null;
  items?: TransactionItemWrite[];
  editReason: string;
};

export type TransactionVoidWrite = {
  voidReason: string;
};

export type TransactionCorrectionResponse = {
  oldTransaction: Transaction;
  newTransaction: Transaction;
  message: string;
};

export type TransactionVoidResponse = {
  transaction: Transaction;
  message: string;
};

export type TransactionHistory = {
  rootTransactionId: number;
  versions: Transaction[];
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
  status?: TransactionStatus;
  includeHistory?: boolean;
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

export type TransactionConfirmation = {
  id: number;
  displayId: string;
  transactionType: TransactionType;
  date: string;
  totalAmount: string;
  note: string;
  paymentMethod: string;
  customerId: number;
  customerNameBn: string;
  customerNameEn: string;
  customerAddressBn: string;
  customerAddressEn: string;
  customerPhone: string;
  items: TransactionItem[];
  currentBalance: string;
  status: TransactionStatus;
  isCurrent: boolean;
  versionNumber: number;
  latestVersionId: number;
  isHistorical: boolean;
  previousVersionId: number | null;
  editReason: string;
  voidReason: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
