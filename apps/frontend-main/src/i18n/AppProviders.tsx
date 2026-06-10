'use client';

import { LanguageProvider } from '@razzak-machinaries/shared/i18n';
import type { ReactNode } from 'react';

import { mainTranslationsBn, mainTranslationsEn } from './translations';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider
      catalogs={{
        en: mainTranslationsEn,
        bn: mainTranslationsBn,
      }}
    >
      {children}
    </LanguageProvider>
  );
}
