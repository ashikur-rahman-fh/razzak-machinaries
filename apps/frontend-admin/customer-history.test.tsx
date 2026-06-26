import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomerHistoryPage } from './src/app/customers/[id]/history/CustomerHistoryPage';
import { CustomerVersionDetailPage } from './src/app/customers/[id]/history/[versionId]/CustomerVersionDetailPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { sampleCustomer } from './src/customers/customer-fixtures';
import { customerMswHandlers } from './src/customers/customer-msw-handlers';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const customerId = String(sampleCustomer.id);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => `/customers/${customerId}/history`,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: customerId, versionId: '2' }),
}));

function renderWithProviders(ui: ReactElement) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...customerMswHandlers,
  );

  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
          ...geoTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
          ...geoTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('CustomerHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders version cards with field-level changes', async () => {
    renderWithProviders(<CustomerHistoryPage />);

    expect(await screen.findByTestId('customer-history-page')).toBeInTheDocument();
    expect(screen.getByText('Rahim Updated')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen
          .getAllByRole('listitem')
          .some(
            (item) =>
              item.textContent?.includes('Rahim Uddin') &&
              item.textContent?.includes('Rahim Updated'),
          ),
      ).toBe(true);
    });
    await waitFor(() => {
      expect(
        screen
          .getAllByRole('listitem')
          .some(
            (item) =>
              item.textContent?.includes('Village: Charpara, Dhaka') &&
              item.textContent?.includes('Updated Village, Dhaka'),
          ),
      ).toBe(true);
    });
    expect(screen.getAllByRole('link', { name: /View this version/i })).toHaveLength(2);
  });
});

describe('CustomerVersionDetailPage', () => {
  it('renders full version snapshot and changes banner', async () => {
    renderWithProviders(<CustomerVersionDetailPage />);

    expect(await screen.findByTestId('customer-version-detail-page')).toBeInTheDocument();
    expect(screen.getByTestId('customer-version-detail-content')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen
          .getAllByRole('listitem')
          .some(
            (item) =>
              item.textContent?.includes('Rahim Uddin') &&
              item.textContent?.includes('Rahim Updated'),
          ),
      ).toBe(true);
    });
    expect(screen.getByText('Updated Village, Dhaka')).toBeInTheDocument();
  });
});
