'use client';

import { LanguageProvider } from '@razzak-machinaries/shared/i18n';
import type { ReactNode } from 'react';

import { customerTranslationsBn, customerTranslationsEn } from './customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './geo-translations';
import { adminTranslationsBn, adminTranslationsEn } from './translations';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...geoTranslationsEn, ...customerTranslationsEn },
        bn: { ...adminTranslationsBn, ...geoTranslationsBn, ...customerTranslationsBn },
      }}
    >
      {children}
    </LanguageProvider>
  );
}
