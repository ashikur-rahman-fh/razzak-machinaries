export type TranslationLanguage = 'bn' | 'en';

export type TranslationRequest = {
  text: string;
  source: TranslationLanguage;
  target: TranslationLanguage;
};

export type TranslationResponse = {
  translatedText: string;
  provider: string;
};
