import { describe, expect, it, beforeEach, vi } from 'vitest';

import { sampleCustomer } from '@/customers/customer-fixtures';

import {
  addRecentCustomer,
  readRecentCustomers,
  type RecentCustomerSnapshot,
} from './recent-customers';

describe('recent-customers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns empty array when storage is empty', () => {
    expect(readRecentCustomers(1)).toEqual([]);
  });

  it('adds customer and dedupes by moving to front', () => {
    const secondCustomer = { ...sampleCustomer, id: 99, fullNameEn: 'Second Customer' };

    addRecentCustomer(1, sampleCustomer);
    addRecentCustomer(1, secondCustomer);
    addRecentCustomer(1, sampleCustomer);

    const recent = readRecentCustomers(1);
    expect(recent.map((item) => item.id)).toEqual([42, 99]);
  });

  it('caps recent customers at five', () => {
    for (let index = 1; index <= 7; index += 1) {
      addRecentCustomer(1, {
        ...sampleCustomer,
        id: index,
        fullNameEn: `Customer ${index}`,
      });
    }

    expect(readRecentCustomers(1)).toHaveLength(5);
    expect(readRecentCustomers(1).map((item) => item.id)).toEqual([7, 6, 5, 4, 3]);
  });

  it('returns empty array for corrupt storage', () => {
    sessionStorage.setItem('halkhata:recent-customers:1', '{not-json');
    expect(readRecentCustomers(1)).toEqual([]);

    sessionStorage.setItem('halkhata:recent-customers:1', JSON.stringify([{ id: 'bad' }]));
    expect(readRecentCustomers(1)).toEqual([]);
  });

  it('scopes storage per halkhata id', () => {
    addRecentCustomer(1, sampleCustomer);
    addRecentCustomer(2, { ...sampleCustomer, id: 99, fullNameEn: 'Other Halkhata' });

    expect(readRecentCustomers(1).map((item: RecentCustomerSnapshot) => item.id)).toEqual([42]);
    expect(readRecentCustomers(2).map((item: RecentCustomerSnapshot) => item.id)).toEqual([99]);
  });

  it('silently handles sessionStorage write failures', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => addRecentCustomer(1, sampleCustomer)).not.toThrow();
    expect(readRecentCustomers(1)).toEqual([]);

    setItem.mockRestore();
  });
});
