import type { BilingualTextValue, Language } from '../types';
import { sharedTranslationsBn } from './translations.bn';
import { sharedTranslationsEn } from './translations.en';

export type TranslationCatalog = Record<string, string>;
export type TranslationKey = string;

export type Translator = (key: TranslationKey) => string;
export type TranslationPairResolver = (key: TranslationKey) => BilingualTextValue;

export function mergeTranslationCatalogs(
  ...catalogs: TranslationCatalog[]
): TranslationCatalog {
  return Object.assign({}, ...catalogs) as TranslationCatalog;
}

export function createTranslator(
  catalogs: Record<Language, TranslationCatalog>,
  language: Language,
): Translator {
  return (key: TranslationKey) => {
    const selected = catalogs[language][key];
    if (selected) {
      return selected;
    }
    const english = catalogs.en[key];
    if (english) {
      return english;
    }
    return key;
  };
}

export function getTranslationPair(
  catalogs: Record<Language, TranslationCatalog>,
  key: TranslationKey,
): BilingualTextValue {
  return {
    en: catalogs.en[key] ?? key,
    bn: catalogs.bn[key] ?? catalogs.en[key] ?? key,
  };
}

export function createTranslationPairResolver(
  catalogs: Record<Language, TranslationCatalog>,
): TranslationPairResolver {
  return (key: TranslationKey) => getTranslationPair(catalogs, key);
}

export const sharedTranslationCatalogs: Record<Language, TranslationCatalog> = {
  en: sharedTranslationsEn,
  bn: mergeTranslationCatalogs(sharedTranslationsEn, sharedTranslationsBn),
};

export function createSharedTranslator(language: Language): Translator {
  return createTranslator(sharedTranslationCatalogs, language);
}

export { sharedTranslationsEn, sharedTranslationsBn };
