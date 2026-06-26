import { describe, expect, it } from 'vitest';

import { formatBdt, formatInteger, multiplyMoneyStrings, sumMoneyStrings } from './currency';

describe('formatInteger', () => {
  it('returns plain integer strings', () => {
    expect(formatInteger('2.00')).toBe('2');
    expect(formatInteger(12300.7)).toBe('12301');
  });
});

describe('formatBdt', () => {
  it('formats BDT without decimal places in English', () => {
    expect(formatBdt(12300, 'en')).toBe('BDT\u00a012,300');
  });

  it('formats BDT without decimal places in Bangla locale', () => {
    expect(formatBdt(12300, 'bn')).toMatch(/12,300|১২,৩০০/);
  });

  it('rounds fractional amounts', () => {
    expect(formatBdt('99.99', 'en')).toBe('BDT\u00a0100');
  });
});

describe('multiplyMoneyStrings', () => {
  it('returns integer product string', () => {
    expect(multiplyMoneyStrings('100', '2')).toBe('200');
  });
});

describe('sumMoneyStrings', () => {
  it('returns integer sum string', () => {
    expect(sumMoneyStrings('100', '50')).toBe('150');
  });
});
