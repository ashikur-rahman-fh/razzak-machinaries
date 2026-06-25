import type {
  PaymentMethod,
  TransactionType,
  TransactionWrite,
} from '@razzak-machinaries/shared/api';
import { multiplyMoneyStrings, sumMoneyStrings } from '@razzak-machinaries/shared/utils/currency';

export type SaleItemFormValues = {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: string;
};

export type TransactionFormValues = {
  customerId: number | null;
  transactionType: TransactionType;
  date: string;
  note: string;
  amount: string;
  paymentMethod: PaymentMethod | '';
  items: SaleItemFormValues[];
};

let saleItemCounter = 0;

export function createEmptySaleItem(id?: string): SaleItemFormValues {
  saleItemCounter += 1;
  return {
    id: id ?? `sale-item-${saleItemCounter}`,
    productName: '',
    unitPrice: '',
    quantity: '1',
  };
}

export const EMPTY_TRANSACTION_FORM: TransactionFormValues = {
  customerId: null,
  transactionType: 'SALE',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  amount: '',
  paymentMethod: 'cash',
  items: [createEmptySaleItem()],
};

export function getSaleGrandTotal(items: SaleItemFormValues[]): string {
  return sumMoneyStrings(
    ...items.map((item) => multiplyMoneyStrings(item.unitPrice || '0', item.quantity || '0')),
  );
}

export function getPreviewAmount(values: TransactionFormValues): string {
  if (values.transactionType === 'SALE') {
    return getSaleGrandTotal(values.items);
  }
  return values.amount || '0';
}

export function validateTransactionForm(
  values: TransactionFormValues,
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};

  if (!values.customerId) {
    errors.customerId = 'transaction.create.validation.customer';
  }
  if (!values.date) {
    errors.date = 'transaction.create.validation.date';
  }

  if (values.transactionType === 'SALE') {
    if (!values.items.length) {
      errors.items = 'transaction.create.validation.items';
    }
    values.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        errors[`items.${index}.productName`] = 'transaction.create.validation.productName';
      }
      const unitPrice = Number.parseFloat(item.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        errors[`items.${index}.unitPrice`] = 'transaction.create.validation.unitPrice';
      }
      const quantity = Number.parseFloat(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        errors[`items.${index}.quantity`] = 'transaction.create.validation.quantity';
      }
    });
  } else {
    const amount = Number.parseFloat(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'transaction.create.validation.amount';
    }
  }

  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value !== undefined));
}

export function buildTransactionWritePayload(values: TransactionFormValues): TransactionWrite {
  const base: TransactionWrite = {
    customerId: values.customerId!,
    transactionType: values.transactionType,
    date: values.date,
    note: values.note.trim() || undefined,
  };

  if (values.transactionType === 'SALE') {
    return {
      ...base,
      items: values.items.map((item) => ({
        productName: item.productName.trim(),
        unitPrice: Number.parseFloat(item.unitPrice).toFixed(2),
        quantity: Number.parseFloat(item.quantity).toString(),
      })),
    };
  }

  if (values.transactionType === 'PAYMENT') {
    return {
      ...base,
      amount: Number.parseFloat(values.amount).toFixed(2),
      paymentMethod: values.paymentMethod || 'cash',
    };
  }

  return {
    ...base,
    amount: Number.parseFloat(values.amount).toFixed(2),
  };
}

export function isTransactionFormValid(values: TransactionFormValues): boolean {
  return Object.keys(validateTransactionForm(values)).length === 0;
}
