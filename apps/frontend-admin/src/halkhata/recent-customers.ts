import type { Customer } from '@razzak-machinaries/shared/api';

export type RecentCustomerSnapshot = Pick<
  Customer,
  'id' | 'fullNameBn' | 'fullNameEn' | 'phone' | 'addressBn' | 'addressEn' | 'cachedBalance'
>;

const MAX_RECENT = 5;

function storageKey(halkhataId: number): string {
  return `halkhata:recent-customers:${halkhataId}`;
}

function isValidSnapshot(value: unknown): value is RecentCustomerSnapshot {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.fullNameBn === 'string' &&
    typeof record.fullNameEn === 'string' &&
    typeof record.phone === 'string' &&
    typeof record.addressBn === 'string' &&
    typeof record.addressEn === 'string' &&
    typeof record.cachedBalance === 'string'
  );
}

export function readRecentCustomers(halkhataId: number): RecentCustomerSnapshot[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(storageKey(halkhataId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidSnapshot).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function toSnapshot(customer: Customer): RecentCustomerSnapshot {
  return {
    id: customer.id,
    fullNameBn: customer.fullNameBn,
    fullNameEn: customer.fullNameEn,
    phone: customer.phone,
    addressBn: customer.addressBn,
    addressEn: customer.addressEn,
    cachedBalance: customer.cachedBalance,
  };
}

export function addRecentCustomer(
  halkhataId: number,
  customer: Customer,
): RecentCustomerSnapshot[] {
  const snapshot = toSnapshot(customer);
  const existing = readRecentCustomers(halkhataId).filter((item) => item.id !== snapshot.id);
  const next = [snapshot, ...existing].slice(0, MAX_RECENT);

  if (typeof window === 'undefined') return next;

  try {
    window.sessionStorage.setItem(storageKey(halkhataId), JSON.stringify(next));
  } catch {
    // Ignore storage failures; UI continues without persisting recents.
  }

  return next;
}

export function recentSnapshotToCustomer(snapshot: RecentCustomerSnapshot): Customer {
  return {
    id: snapshot.id,
    fullNameBn: snapshot.fullNameBn,
    fullNameEn: snapshot.fullNameEn,
    phone: snapshot.phone,
    phoneBn: snapshot.phone,
    phoneEn: snapshot.phone,
    addressBn: snapshot.addressBn,
    addressEn: snapshot.addressEn,
    fatherNameBn: '',
    fatherNameEn: '',
    memoPageNumberBn: '',
    memoPageNumberEn: '',
    mediatorNameBn: '',
    mediatorNameEn: '',
    profilePictureUrl: null,
    cachedBalance: snapshot.cachedBalance,
    isArchived: false,
    archivedAt: null,
    archiveReason: '',
    archivedByName: null,
    createdAt: '',
    updatedAt: '',
  };
}
