import { describe, expect, it } from 'vitest';

import {
  createEmptySaleItem,
  getPreviewAmount,
  getSaleGrandTotal,
  isTransactionFormValid,
  isWholeNumber,
  validateTransactionForm,
  type TransactionFormValues,
} from './validation';

const baseValues: TransactionFormValues = {
  customerId: 1,
  transactionType: 'SALE',
  date: '2026-06-25',
  note: '',
  amount: '',
  paymentMethod: 'cash',
  items: [
    {
      id: '1',
      productName: 'Tractor',
      unitPrice: '100',
      quantity: '2',
    },
  ],
};

describe('transaction validation', () => {
  it('calculates sale grand total from items', () => {
    expect(getSaleGrandTotal(baseValues.items)).toBe('200');
  });

  it('calculates preview amount for payment', () => {
    expect(
      getPreviewAmount({
        ...baseValues,
        transactionType: 'PAYMENT',
        amount: '150',
      }),
    ).toBe('150');
  });

  it('requires at least one sale item', () => {
    const errors = validateTransactionForm({
      ...baseValues,
      items: [],
    });
    expect(errors.items).toBe('transaction.create.validation.items');
  });

  it('rejects non-positive payment amount', () => {
    const errors = validateTransactionForm({
      ...baseValues,
      transactionType: 'PAYMENT',
      amount: '0',
    });
    expect(errors.amount).toBe('transaction.create.validation.amount');
  });

  it('validates complete sale form', () => {
    expect(isTransactionFormValid(baseValues)).toBe(true);
  });

  it('creates empty sale item with default quantity', () => {
    const item = createEmptySaleItem('test-id');
    expect(item.id).toBe('test-id');
    expect(item.quantity).toBe('1');
  });

  it('rejects decimal unit price', () => {
    const errors = validateTransactionForm({
      ...baseValues,
      items: [{ ...baseValues.items[0], unitPrice: '99.50' }],
    });
    expect(errors['items.0.unitPrice']).toBe('transaction.create.validation.unitPrice');
  });

  it('rejects decimal quantity', () => {
    const errors = validateTransactionForm({
      ...baseValues,
      items: [{ ...baseValues.items[0], quantity: '1.5' }],
    });
    expect(errors['items.0.quantity']).toBe('transaction.create.validation.quantity');
  });

  it('rejects decimal payment amount', () => {
    const errors = validateTransactionForm({
      ...baseValues,
      transactionType: 'PAYMENT',
      amount: '150.25',
    });
    expect(errors.amount).toBe('transaction.create.validation.amount');
  });
});

describe('isWholeNumber', () => {
  it('accepts non-negative integers', () => {
    expect(isWholeNumber('0')).toBe(true);
    expect(isWholeNumber('100')).toBe(true);
  });

  it('rejects decimals and invalid values', () => {
    expect(isWholeNumber('10.5')).toBe(false);
    expect(isWholeNumber('')).toBe(false);
    expect(isWholeNumber('abc')).toBe(false);
  });
});
