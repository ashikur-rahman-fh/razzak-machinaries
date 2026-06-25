import type { Customer } from '@razzak-machinaries/shared/api';

export function formatCustomerPhone(customer: Pick<Customer, 'phoneEn' | 'phone'>): string {
  return customer.phoneEn || customer.phone;
}

export function truncateAddress(text: string, maxLength = 48): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function hasMediator(
  customer: Pick<Customer, 'mediatorNameBn' | 'mediatorNameEn'>,
): boolean {
  return Boolean(customer.mediatorNameBn.trim() || customer.mediatorNameEn.trim());
}

export function formatCustomerDate(iso: string, language: 'en' | 'bn'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCustomerInitials(customer: Pick<Customer, 'fullNameBn' | 'fullNameEn'>): string {
  const source = customer.fullNameEn.trim() || customer.fullNameBn.trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
