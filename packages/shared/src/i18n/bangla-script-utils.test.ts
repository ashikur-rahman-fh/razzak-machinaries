import { describe, expect, it } from 'vitest';

import {
  banglaToLatinDigits,
  banglaToLatinDigitsOnly,
  banglaToLatinPhone,
  isDigitsOnly,
  isValidMemoBnInput,
} from './bangla-script-utils';

describe('banglaToLatinDigits', () => {
  it('converts Bengali numerals to ASCII digits', () => {
    expect(banglaToLatinDigits('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
  });

  it('leaves ASCII digits unchanged', () => {
    expect(banglaToLatinDigits('01712345678')).toBe('01712345678');
  });
});

describe('banglaToLatinPhone', () => {
  it('converts Bengali phone digits', () => {
    expect(banglaToLatinPhone('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
  });

  it('preserves leading plus for international format', () => {
    expect(banglaToLatinPhone('+৮৮০১৭১২৩৪৫৬৭৮')).toBe('+8801712345678');
  });
});

describe('banglaToLatinDigitsOnly', () => {
  it('converts memo page Bengali numerals', () => {
    expect(banglaToLatinDigitsOnly('১২৩')).toBe('123');
  });

  it('strips non-digit characters', () => {
    expect(banglaToLatinDigitsOnly('১২এ')).toBe('12');
  });
});

describe('isValidMemoBnInput', () => {
  it('accepts Bengali and ASCII digits', () => {
    expect(isValidMemoBnInput('১২৩')).toBe(true);
    expect(isValidMemoBnInput('123')).toBe(true);
  });

  it('rejects letters and symbols', () => {
    expect(isValidMemoBnInput('১২এ')).toBe(false);
    expect(isValidMemoBnInput('12A')).toBe(false);
  });
});

describe('isDigitsOnly', () => {
  it('accepts ASCII digits', () => {
    expect(isDigitsOnly('123')).toBe(true);
  });

  it('rejects empty and non-digit values', () => {
    expect(isDigitsOnly('')).toBe(false);
    expect(isDigitsOnly('12A')).toBe(false);
  });
});
