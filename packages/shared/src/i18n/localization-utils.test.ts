import { describe, expect, it } from 'vitest';

import {
  getBilingualDisplay,
  getLocalizedField,
  getLocalizedText,
  isBanglaText,
  normalizeLanguagePreference,
} from './localization-utils';

describe('getLocalizedText', () => {
  it('returns Bangla when language is bn and both exist', () => {
    expect(getLocalizedText({ en: 'Custom Printing', bn: 'কাস্টম প্রিন্টিং' }, 'bn')).toBe(
      'কাস্টম প্রিন্টিং',
    );
  });

  it('falls back to English when Bangla is empty', () => {
    expect(getLocalizedText({ en: 'Custom Printing', bn: '' }, 'bn')).toBe('Custom Printing');
  });

  it('falls back to Bangla when English is empty', () => {
    expect(getLocalizedText({ en: '', bn: 'কাস্টম প্রিন্টিং' }, 'en')).toBe('কাস্টম প্রিন্টিং');
  });

  it('returns fallback when both are missing', () => {
    expect(getLocalizedText({ en: '', bn: null }, 'en', 'Default')).toBe('Default');
  });
});

describe('getBilingualDisplay', () => {
  it('returns both languages when display mode is both', () => {
    const result = getBilingualDisplay({ en: 'Custom Printing', bn: 'কাস্টম প্রিন্টিং' }, 'both');
    expect(result.primary).toEqual({ text: 'Custom Printing', lang: 'en' });
    expect(result.secondary).toEqual({ text: 'কাস্টম প্রিন্টিং', lang: 'bn' });
  });

  it('does not duplicate equal text', () => {
    const result = getBilingualDisplay({ en: 'Same', bn: 'same' }, 'both');
    expect(result.primary).toEqual({ text: 'Same', lang: 'en' });
    expect(result.secondary).toBeNull();
  });

  it('shows only one when the other is missing', () => {
    const result = getBilingualDisplay({ en: 'Only English', bn: '' }, 'both');
    expect(result.primary).toEqual({ text: 'Only English', lang: 'en' });
    expect(result.secondary).toBeNull();
  });
});

describe('getLocalizedField', () => {
  it('reads camelCase API fields', () => {
    expect(getLocalizedField({ titleEn: 'English', titleBn: 'বাংলা' }, 'title', 'bn')).toBe(
      'বাংলা',
    );
  });

  it('reads snake_case fields', () => {
    expect(getLocalizedField({ title_en: 'English', title_bn: 'বাংলা' }, 'title', 'bn')).toBe(
      'বাংলা',
    );
  });

  it('ignores object-valued fields instead of stringifying them', () => {
    expect(getLocalizedField({ titleEn: { nested: true } }, 'title', 'en', 'Default')).toBe(
      'Default',
    );
  });
});

describe('isBanglaText', () => {
  it('detects Bengali script', () => {
    expect(isBanglaText('কাস্টম')).toBe(true);
    expect(isBanglaText('Custom')).toBe(false);
  });
});

describe('normalizeLanguagePreference', () => {
  it('returns defaults for invalid input', () => {
    expect(normalizeLanguagePreference(null)).toEqual({
      language: 'en',
      displayMode: 'en',
    });
  });

  it('normalizes partial input', () => {
    expect(normalizeLanguagePreference({ language: 'bn' })).toEqual({
      language: 'bn',
      displayMode: 'en',
    });
  });
});
