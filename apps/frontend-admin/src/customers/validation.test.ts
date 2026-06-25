import { describe, expect, it } from 'vitest';

import {
  resolveMemoLatin,
  resolvePhoneLatin,
  trimCustomerFormValues,
  validateCustomerForm,
  type CustomerFormValues,
} from './validation';

const validValues: CustomerFormValues = {
  fullNameBn: 'রহিম',
  fullNameEn: 'Rahim',
  addressBn: 'ঠিকানা',
  addressEn: 'Address',
  phoneBn: '০১৭১২৩৪৫৬৭৮',
  phoneEn: '',
  fatherNameBn: 'করিম',
  fatherNameEn: 'Karim',
  memoPageNumberBn: '১২৩',
  memoPageNumberEn: '',
  mediatorNameBn: '',
  mediatorNameEn: '',
};

describe('validateCustomerForm', () => {
  it('returns no errors for valid Bangla-only phone and memo', () => {
    expect(validateCustomerForm(validValues)).toEqual({});
  });

  it('requires mandatory fields', () => {
    const errors = validateCustomerForm({
      ...validValues,
      fullNameBn: '',
      memoPageNumberBn: '',
    });
    expect(errors.fullNameBn).toBe('customer.validation.required');
    expect(errors.memoPageNumberBn).toBe('customer.validation.required');
  });

  it('rejects invalid phone numbers', () => {
    const errors = validateCustomerForm({
      ...validValues,
      phoneBn: '12345',
      phoneEn: '12345',
    });
    expect(errors.phoneBn).toBe('customer.validation.invalidPhone');
  });

  it('rejects memo page numbers with letters', () => {
    const errors = validateCustomerForm({
      ...validValues,
      memoPageNumberBn: '১২এ',
    });
    expect(errors.memoPageNumberBn).toBe('customer.validation.invalidMemoPageNumber');
  });
});

describe('resolvePhoneLatin', () => {
  it('converts Bangla phone when Latin is empty', () => {
    expect(resolvePhoneLatin(validValues)).toBe('01712345678');
  });

  it('prefers manual Latin phone', () => {
    expect(resolvePhoneLatin({ ...validValues, phoneEn: '01812345678' })).toBe('01812345678');
  });
});

describe('resolveMemoLatin', () => {
  it('converts Bangla memo when Latin is empty', () => {
    expect(resolveMemoLatin(validValues)).toBe('123');
  });
});

describe('trimCustomerFormValues', () => {
  it('trims whitespace from all fields', () => {
    const trimmed = trimCustomerFormValues({
      ...validValues,
      fullNameBn: '  রহিম  ',
      phoneBn: ' ০১৭১২৩৪৫৬৭৮ ',
    });
    expect(trimmed.fullNameBn).toBe('রহিম');
    expect(trimmed.phoneBn).toBe('০১৭১২৩৪৫৬৭৮');
  });
});
