export type Language = 'en' | 'bn';

export type DisplayMode = 'en' | 'bn' | 'both';

export type BilingualTextValue = {
  en?: string | null;
  bn?: string | null;
};

export type LanguagePreference = {
  language: Language;
  displayMode: DisplayMode;
};

export const DEFAULT_LANGUAGE: Language = 'en';
export const DEFAULT_DISPLAY_MODE: DisplayMode = 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'bn'];
export const SUPPORTED_DISPLAY_MODES: DisplayMode[] = ['en', 'bn', 'both'];

export type BilingualDisplayPart = {
  text: string;
  lang: Language;
};

export type BilingualDisplay = {
  primary: BilingualDisplayPart | null;
  secondary: BilingualDisplayPart | null;
};
