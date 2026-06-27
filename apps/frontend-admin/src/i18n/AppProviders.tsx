'use client';

import { LanguageProvider } from '@razzak-machinaries/shared/i18n';
import type { ReactNode } from 'react';

import { customerTranslationsBn, customerTranslationsEn } from './customer-translations';
import { dashboardTranslationsBn, dashboardTranslationsEn } from './dashboard-translations';
import { editHistoryTranslationsBn, editHistoryTranslationsEn } from './edit-history-translations';
import { followUpTranslationsBn, followUpTranslationsEn } from './follow-up-translations';
import { geoTranslationsBn, geoTranslationsEn } from './geo-translations';
import { transactionTranslationsBn, transactionTranslationsEn } from './transaction-translations';
import { staffTranslationsBn, staffTranslationsEn } from './staff-translations';
import { adminTranslationsBn, adminTranslationsEn } from './translations';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...dashboardTranslationsEn,
          ...editHistoryTranslationsEn,
          ...geoTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
          ...staffTranslationsEn,
          ...followUpTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...dashboardTranslationsBn,
          ...editHistoryTranslationsBn,
          ...geoTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
          ...staffTranslationsBn,
          ...followUpTranslationsBn,
        },
      }}
    >
      {children}
    </LanguageProvider>
  );
}
