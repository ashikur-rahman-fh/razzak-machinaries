import { describe, expect, it } from 'vitest';

import { createTranslator, getTranslationPair, mergeTranslationCatalogs } from './translations';
import { sharedTranslationsBn } from './translations.bn';
import { sharedTranslationsEn } from './translations.en';

describe('createTranslator', () => {
  const catalogs = {
    en: sharedTranslationsEn,
    bn: mergeTranslationCatalogs(sharedTranslationsEn, sharedTranslationsBn),
  };

  it('returns Bangla translation when available', () => {
    const t = createTranslator(catalogs, 'bn');
    expect(t('common.save')).toBe('সংরক্ষণ');
  });

  it('falls back to English for missing Bangla key', () => {
    const t = createTranslator(
      {
        en: { 'only.en': 'English only' },
        bn: {},
      },
      'bn',
    );
    expect(t('only.en')).toBe('English only');
  });

  it('falls back to key when translation is missing', () => {
    const t = createTranslator(catalogs, 'en');
    expect(t('missing.key')).toBe('missing.key');
  });
});

describe('getTranslationPair', () => {
  const catalogs = {
    en: sharedTranslationsEn,
    bn: mergeTranslationCatalogs(sharedTranslationsEn, sharedTranslationsBn),
  };

  it('returns en and bn strings for a known key', () => {
    expect(getTranslationPair(catalogs, 'common.save')).toEqual({
      en: 'Save',
      bn: 'সংরক্ষণ',
    });
  });

  it('falls back to English for missing Bangla key', () => {
    expect(getTranslationPair(catalogs, 'missing.key')).toEqual({
      en: 'missing.key',
      bn: 'missing.key',
    });
  });
});
