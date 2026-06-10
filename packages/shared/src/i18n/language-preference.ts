import { DISPLAY_MODE_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from './constants';
import { normalizeLanguagePreference } from './localization-utils';
import {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_LANGUAGE,
  type DisplayMode,
  type Language,
  type LanguagePreference,
} from './types';

export function getDefaultLanguagePreference(): LanguagePreference {
  return {
    language: DEFAULT_LANGUAGE,
    displayMode: DEFAULT_DISPLAY_MODE,
  };
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readLanguagePreferenceFromStorage(): LanguagePreference {
  if (!canUseStorage()) {
    return getDefaultLanguagePreference();
  }

  try {
    const language = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const displayMode = window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);

    return normalizeLanguagePreference({
      language: language ?? undefined,
      displayMode: displayMode ?? undefined,
    });
  } catch {
    return getDefaultLanguagePreference();
  }
}

export function writeLanguagePreferenceToStorage(preference: LanguagePreference): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
    window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
  } catch {
    // Ignore storage quota or privacy mode errors.
  }
}

export function applyDocumentLanguage(language: Language): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = language;
}

export function applyDocumentDisplayMode(displayMode: DisplayMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.contentDisplay = displayMode;
}

export function applyDocumentLanguagePreference(preference: LanguagePreference): void {
  applyDocumentLanguage(preference.language);
  applyDocumentDisplayMode(preference.displayMode);
}

export function createLanguagePreferenceUpdate(
  current: LanguagePreference,
  update: Partial<LanguagePreference>,
): LanguagePreference {
  return normalizeLanguagePreference({ ...current, ...update });
}

export type { Language, DisplayMode, LanguagePreference };
