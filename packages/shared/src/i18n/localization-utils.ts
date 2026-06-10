import {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_LANGUAGE,
  SUPPORTED_DISPLAY_MODES,
  SUPPORTED_LANGUAGES,
  type BilingualDisplay,
  type BilingualTextValue,
  type DisplayMode,
  type Language,
  type LanguagePreference,
} from './types';

function isMissing(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function normalizeText(value: string): string {
  return value.trim();
}

function toBilingualValue(value: BilingualTextValue | null | undefined): BilingualTextValue {
  return value ?? {};
}

export function getLocalizedText(
  value: BilingualTextValue | null | undefined,
  language: Language,
  fallback = '',
): string {
  const { en, bn } = toBilingualValue(value);
  const enText = isMissing(en) ? '' : normalizeText(en!);
  const bnText = isMissing(bn) ? '' : normalizeText(bn!);

  if (language === 'en') {
    return enText || bnText || fallback;
  }

  return bnText || enText || fallback;
}

export function getBilingualDisplay(
  value: BilingualTextValue | null | undefined,
  displayMode: DisplayMode,
  options?: { primaryLanguage?: Language },
): BilingualDisplay {
  const { en, bn } = toBilingualValue(value);
  const enText = isMissing(en) ? '' : normalizeText(en!);
  const bnText = isMissing(bn) ? '' : normalizeText(bn!);

  if (displayMode === 'en' || displayMode === 'bn') {
    const text = getLocalizedText(value, displayMode);
    if (!text) {
      return { primary: null, secondary: null };
    }
    const lang: Language = displayMode === 'en' ? (enText ? 'en' : 'bn') : bnText ? 'bn' : 'en';
    return { primary: { text, lang }, secondary: null };
  }

  if (!enText && !bnText) {
    return { primary: null, secondary: null };
  }

  if (enText && bnText && enText.toLowerCase() === bnText.toLowerCase()) {
    return { primary: { text: enText, lang: 'en' }, secondary: null };
  }

  const primaryLanguage = options?.primaryLanguage ?? 'en';

  if (enText && !bnText) {
    return { primary: { text: enText, lang: 'en' }, secondary: null };
  }

  if (bnText && !enText) {
    return { primary: { text: bnText, lang: 'bn' }, secondary: null };
  }

  if (primaryLanguage === 'bn') {
    return {
      primary: { text: bnText, lang: 'bn' },
      secondary: { text: enText, lang: 'en' },
    };
  }

  return {
    primary: { text: enText, lang: 'en' },
    secondary: { text: bnText, lang: 'bn' },
  };
}

function readField(record: Record<string, unknown>, key: string): string | null | undefined {
  const value = record[key];
  if (value == null) {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

export function getLocalizedField(
  record: Record<string, unknown> | null | undefined,
  baseFieldName: string,
  language: Language,
  fallback = '',
): string {
  if (!record) {
    return fallback;
  }

  const camelEn = `${baseFieldName}En`;
  const camelBn = `${baseFieldName}Bn`;
  const snakeEn = `${baseFieldName}_en`;
  const snakeBn = `${baseFieldName}_bn`;

  return getLocalizedText(
    {
      en: readField(record, camelEn) ?? readField(record, snakeEn),
      bn: readField(record, camelBn) ?? readField(record, snakeBn),
    },
    language,
    fallback,
  );
}

const BANGLA_SCRIPT_PATTERN = /[\u0980-\u09FF]/;

export function isBanglaText(value: string | null | undefined): boolean {
  if (isMissing(value)) {
    return false;
  }
  return BANGLA_SCRIPT_PATTERN.test(value!);
}

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'bn';
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'en' || value === 'bn' || value === 'both';
}

export function normalizeLanguagePreference(value: unknown): LanguagePreference {
  const defaultPreference: LanguagePreference = {
    language: DEFAULT_LANGUAGE,
    displayMode: DEFAULT_DISPLAY_MODE,
  };

  if (value == null || typeof value !== 'object') {
    return defaultPreference;
  }

  const record = value as Record<string, unknown>;
  const language = isLanguage(record.language) ? record.language : DEFAULT_LANGUAGE;
  const displayMode = isDisplayMode(record.displayMode) ? record.displayMode : DEFAULT_DISPLAY_MODE;

  return {
    language: SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE,
    displayMode: SUPPORTED_DISPLAY_MODES.includes(displayMode) ? displayMode : DEFAULT_DISPLAY_MODE,
  };
}
