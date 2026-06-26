import type {
  PaymentMethod,
  Transaction,
  TransactionCorrectionWrite,
  TransactionType,
  TransactionWrite,
} from '@razzak-machinaries/shared/api';
import { multiplyMoneyStrings, sumMoneyStrings } from '@razzak-machinaries/shared/utils/currency';

export function isWholeNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed);
}

function normalizeInteger(value: string): string {
  return String(Math.round(Number.parseFloat(value)));
}

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
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isInteger(unitPrice)) {
        errors[`items.${index}.unitPrice`] = 'transaction.create.validation.unitPrice';
      }
      const quantity = Number.parseFloat(item.quantity);
      if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
        errors[`items.${index}.quantity`] = 'transaction.create.validation.quantity';
      }
    });
  } else {
    const amount = Number.parseFloat(values.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
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
        unitPrice: normalizeInteger(item.unitPrice),
        quantity: normalizeInteger(item.quantity),
      })),
    };
  }

  if (values.transactionType === 'PAYMENT') {
    return {
      ...base,
      amount: normalizeInteger(values.amount),
      paymentMethod: values.paymentMethod || 'cash',
    };
  }

  return {
    ...base,
    amount: normalizeInteger(values.amount),
  };
}

export function isTransactionFormValid(values: TransactionFormValues): boolean {
  return Object.keys(validateTransactionForm(values)).length === 0;
}

export function transactionToFormValues(transaction: Transaction): TransactionFormValues {
  return {
    customerId: transaction.customerId,
    transactionType: transaction.transactionType,
    date: transaction.date,
    note: transaction.note,
    amount: transaction.amount,
    paymentMethod: (transaction.paymentMethod as PaymentMethod) || 'cash',
    items:
      transaction.items.length > 0
        ? transaction.items.map((item) => ({
            id: `item-${item.id}`,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          }))
        : [createEmptySaleItem()],
  };
}

export function buildTransactionCorrectionPayload(
  values: TransactionFormValues,
  editReason: string,
): TransactionCorrectionWrite {
  const base = buildTransactionWritePayload(values);
  return {
    transactionType: base.transactionType,
    date: base.date,
    note: base.note,
    amount: base.amount,
    paymentMethod: base.paymentMethod,
    items: base.items,
    editReason: editReason.trim(),
  };
}
