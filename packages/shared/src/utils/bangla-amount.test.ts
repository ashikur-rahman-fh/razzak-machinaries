import { describe, expect, it } from 'vitest';

import {
  convertNumberToBanglaWords,
  formatAmountInBanglaWords,
  formatCurrencyBn,
  toBanglaDigits,
} from './bangla-amount';

describe('formatCurrencyBn', () => {
  it('formats BDT with latin digits by default', () => {
    expect(formatCurrencyBn(12300)).toBe('৳12,300.00');
  });

  it('formats BDT with Bangla digits when requested', () => {
    expect(formatCurrencyBn(12300, { useBanglaDigits: true })).toBe('৳১২,৩০০.০০');
  });
});

describe('toBanglaDigits', () => {
  it('converts latin digits to Bangla digits', () => {
    expect(toBanglaDigits('123')).toBe('১২৩');
  });
});

describe('convertNumberToBanglaWords', () => {
  it.each([
    [0, 'শূন্য'],
    [300, 'তিন শত'],
    [12300, 'বারো হাজার তিন শত'],
    [123000, 'এক লাখ তেইশ হাজার'],
    [12300000, 'এক কোটি তেইশ লাখ'],
  ])('converts %i to %s', (amount, expected) => {
    expect(convertNumberToBanglaWords(amount)).toBe(expected);
  });
});

describe('formatAmountInBanglaWords', () => {
  it('appends taka suffix', () => {
    expect(formatAmountInBanglaWords(12300)).toBe('বারো হাজার তিন শত টাকা মাত্র');
  });
});
