'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  applyDocumentLanguagePreference,
  createLanguagePreferenceUpdate,
  getDefaultLanguagePreference,
  readLanguagePreferenceFromStorage,
  writeLanguagePreferenceToStorage,
} from './language-preference';
import type { DisplayMode, Language, LanguagePreference } from './types';
import {
  createTranslator,
  createTranslationPairResolver,
  mergeTranslationCatalogs,
  sharedTranslationCatalogs,
  type TranslationCatalog,
  type TranslationPairResolver,
  type Translator,
} from './translations/translations';

export type LanguageContextValue = {
  language: Language;
  displayMode: DisplayMode;
  preference: LanguagePreference;
  setLanguage: (language: Language) => void;
  setDisplayMode: (displayMode: DisplayMode) => void;
  setPreference: (preference: Partial<LanguagePreference>) => void;
  t: Translator;
  tPair: TranslationPairResolver;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export type LanguageProviderProps = {
  children: ReactNode;
  catalogs?: Partial<Record<Language, TranslationCatalog>>;
};

export function LanguageProvider({ children, catalogs }: LanguageProviderProps) {
  const [preference, setPreferenceState] = useState<LanguagePreference>(getDefaultLanguagePreference);

  useEffect(() => {
    const stored = readLanguagePreferenceFromStorage();
    setPreferenceState(stored);
    applyDocumentLanguagePreference(stored);
  }, []);

  const mergedCatalogs = useMemo(
    () => ({
      en: mergeTranslationCatalogs(sharedTranslationCatalogs.en, catalogs?.en ?? {}),
      bn: mergeTranslationCatalogs(sharedTranslationCatalogs.bn, catalogs?.bn ?? {}),
    }),
    [catalogs],
  );

  const setLanguage = useCallback(
    (language: Language) => {
      setPreferenceState((current) => {
        const next = createLanguagePreferenceUpdate(current, { language });
        writeLanguagePreferenceToStorage(next);
        applyDocumentLanguagePreference(next);
        return next;
      });
    },
    [],
  );

  const setDisplayMode = useCallback(
    (displayMode: DisplayMode) => {
      setPreferenceState((current) => {
        const next = createLanguagePreferenceUpdate(current, { displayMode });
        writeLanguagePreferenceToStorage(next);
        applyDocumentLanguagePreference(next);
        return next;
      });
    },
    [],
  );

  const setPreference = useCallback((update: Partial<LanguagePreference>) => {
    setPreferenceState((current) => {
      const next = createLanguagePreferenceUpdate(current, update);
      writeLanguagePreferenceToStorage(next);
      applyDocumentLanguagePreference(next);
      return next;
    });
  }, []);

  const t = useMemo(
    () => createTranslator(mergedCatalogs, preference.language),
    [mergedCatalogs, preference.language],
  );

  const tPair = useMemo(
    () => createTranslationPairResolver(mergedCatalogs),
    [mergedCatalogs],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: preference.language,
      displayMode: preference.displayMode,
      preference,
      setLanguage,
      setDisplayMode,
      setPreference,
      t,
      tPair,
    }),
    [preference, setDisplayMode, setLanguage, setPreference, t, tPair],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguagePreference(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguagePreference must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation(): Pick<LanguageContextValue, 't' | 'tPair'> {
  const { t, tPair } = useLanguagePreference();
  return { t, tPair };
}
