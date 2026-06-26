import { describe, expect, it } from 'vitest';

import type { Transaction } from '@razzak-machinaries/shared/api';

import { getTransactionVersionChanges } from './version-diff';

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    displayId: 'COM-1',
    customerId: 42,
    customerNameBn: 'রহিম',
    customerNameEn: 'Rahim',
    customerNameSnapshotBn: 'রহিম',
    customerNameSnapshotEn: 'Rahim',
    customerAddressSnapshotBn: 'ঠিকানা',
    customerAddressSnapshotEn: 'Address',
    customerPhoneSnapshot: '+8801712345678',
    transactionType: 'SALE',
    date: '2026-06-24',
    amount: '100.00',
    totalAmount: '100.00',
    note: 'Original note',
    paymentMethod: 'cash',
    status: 'ACTIVE',
    isCurrent: true,
    versionNumber: 1,
    rootTransactionId: 1,
    previousVersionId: null,
    editedFromId: null,
    nextVersionId: null,
    latestVersionId: 1,
    editReason: '',
    editedByName: null,
    editedAt: null,
    voidReason: '',
    voidedByName: null,
    voidedAt: null,
    balanceImpact: '100.00',
    items: [
      {
        id: 1,
        productName: 'Widget',
        unitPrice: '50.00',
        quantity: '2',
        lineTotal: '100.00',
        createdAt: '2026-06-24T10:00:00Z',
        updatedAt: '2026-06-24T10:00:00Z',
      },
    ],
    createdByName: 'admin',
    createdAt: '2026-06-24T10:00:00Z',
    updatedAt: '2026-06-24T10:00:00Z',
    ...overrides,
  };
}

describe('getTransactionVersionChanges', () => {
  it('returns no changes when snapshots match', () => {
    const transaction = buildTransaction();
    expect(getTransactionVersionChanges(transaction, { ...transaction, id: 2 })).toEqual([]);
  });

  it('detects scalar field changes', () => {
    const previous = buildTransaction();
    const current = buildTransaction({
      id: 2,
      date: '2026-06-25',
      totalAmount: '150.00',
      note: 'Updated note',
      paymentMethod: 'bkash',
    });

    const changes = getTransactionVersionChanges(previous, current);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'transaction.create.date',
          from: '2026-06-24',
          to: '2026-06-25',
        }),
        expect.objectContaining({
          labelKey: 'transaction.total',
          from: '100.00',
          to: '150.00',
        }),
        expect.objectContaining({
          labelKey: 'transaction.create.note',
          from: 'Original note',
          to: 'Updated note',
        }),
        expect.objectContaining({
          labelKey: 'transaction.create.paymentMethod',
          from: 'cash',
          to: 'bkash',
        }),
      ]),
    );
  });

  it('detects line item summary changes', () => {
    const previous = buildTransaction();
    const current = buildTransaction({
      id: 2,
      items: [
        {
          id: 2,
          productName: 'Gadget',
          unitPrice: '75.00',
          quantity: '1',
          lineTotal: '75.00',
          createdAt: '2026-06-24T10:00:00Z',
          updatedAt: '2026-06-24T10:00:00Z',
        },
      ],
    });

    expect(getTransactionVersionChanges(previous, current)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'transaction.history.changes.items',
          from: 'Widget × 2 @ 50.00',
          to: 'Gadget × 1 @ 75.00',
        }),
      ]),
    );
  });
});
