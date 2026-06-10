export type {
  BilingualDisplay,
  BilingualDisplayPart,
  BilingualTextValue,
  DisplayMode,
  Language,
  LanguagePreference,
} from './types';
export {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_LANGUAGE,
  SUPPORTED_DISPLAY_MODES,
  SUPPORTED_LANGUAGES,
} from './types';
export { DISPLAY_MODE_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from './constants';
export {
  getLocalizedText,
  getBilingualDisplay,
  getLocalizedField,
  isBanglaText,
  normalizeLanguagePreference,
} from './localization-utils';
export {
  applyDocumentDisplayMode,
  applyDocumentLanguage,
  applyDocumentLanguagePreference,
  createLanguagePreferenceUpdate,
  getDefaultLanguagePreference,
  readLanguagePreferenceFromStorage,
  writeLanguagePreferenceToStorage,
} from './language-preference';
export {
  ERROR_CODE_MESSAGES,
  USER_MESSAGES,
  USER_MESSAGES_BN,
  getLocalizedErrorCodeMessage,
  getLocalizedUserMessage,
} from './error-messages';
export {
  createSharedTranslator,
  createTranslator,
  createTranslationPairResolver,
  getTranslationPair,
  mergeTranslationCatalogs,
  sharedTranslationCatalogs,
  sharedTranslationsBn,
  sharedTranslationsEn,
  type TranslationCatalog,
  type TranslationKey,
  type TranslationPairResolver,
  type Translator,
} from './translations/translations';
export { LanguageProvider, useLanguagePreference, useTranslation } from './LanguageProvider';
export type { LanguageContextValue, LanguageProviderProps } from './LanguageProvider';
