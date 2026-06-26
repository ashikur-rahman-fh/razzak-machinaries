import { describe, expect, it } from 'vitest';

import { formatAdminDisplayName, getAdminInitials } from './admin-user-display';

describe('formatAdminDisplayName', () => {
  it('formats first name and first letter of last name', () => {
    expect(formatAdminDisplayName('Admin', 'User')).toBe('Admin U.');
  });

  it('returns first name only when last name is empty', () => {
    expect(formatAdminDisplayName('Admin', '')).toBe('Admin');
  });

  it('returns first letter of last name when first name is empty', () => {
    expect(formatAdminDisplayName('', 'User')).toBe('U.');
  });

  it('falls back to username when both names are empty', () => {
    expect(formatAdminDisplayName('', '', 'admin')).toBe('admin');
  });

  it('returns ? when all values are empty', () => {
    expect(formatAdminDisplayName('', '')).toBe('?');
  });
});

describe('getAdminInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getAdminInitials('Admin', 'User')).toBe('AU');
  });

  it('returns first two characters of first name when last name is empty', () => {
    expect(getAdminInitials('Admin', '')).toBe('AD');
  });

  it('returns first two characters of last name when first name is empty', () => {
    expect(getAdminInitials('', 'User')).toBe('US');
  });

  it('returns ? when both names are empty', () => {
    expect(getAdminInitials('', '')).toBe('?');
  });
});
