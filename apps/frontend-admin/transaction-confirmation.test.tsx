import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  type LanguagePreference,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionConfirmationPage } from './src/app/transactions/[id]/confirmation/TransactionConfirmationPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import {
  samplePaymentConfirmation,
  sampleSaleConfirmation,
  transactionMswHandlers,
} from './src/transactions/transaction-msw-handlers';
import { adminUser, server } from './vitest.setup';

const pushMock = vi.fn();
let mockParams = { id: String(sampleSaleConfirmation.id) };

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: pushMock,
    refresh: vi.fn(),
  }),
  usePathname: () => `/transactions/${mockParams.id}/confirmation`,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

function setLanguagePreference(preference: LanguagePreference) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
}

function renderWithAuth(ui: ReactElement) {
  setLanguagePreference({ language: 'en', displayMode: 'en' });
  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...geoTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...geoTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

function setupAuthenticatedConfirmationHandlers() {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    ...transactionMswHandlers,
  );
}

describe('TransactionConfirmationPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockParams = { id: String(sampleSaleConfirmation.id) };
    setupAuthenticatedConfirmationHandlers();
  });

  it('renders sale receipt with product table and amount in words', async () => {
    renderWithAuth(<TransactionConfirmationPage />);

    expect(await screen.findByText('রজ্জাক মেশিনারিজ স্টোর')).toBeInTheDocument();
    expect(screen.getByText('লেনদেনের রসিদ')).toBeInTheDocument();
    expect(screen.getByText('COM-25')).toBeInTheDocument();
    expect(screen.getByText('ট্রাক্টর পার্টস')).toBeInTheDocument();
    expect(screen.getByText('বারো হাজার তিন শত টাকা মাত্র')).toBeInTheDocument();
  });

  it('renders payment summary without product table', async () => {
    mockParams = { id: String(samplePaymentConfirmation.id) };
    renderWithAuth(<TransactionConfirmationPage />);

    await screen.findByText('COM-26');
    expect(screen.getByText('পেমেন্টের পরিমাণ')).toBeInTheDocument();
    expect(screen.queryByText('পণ্যের নাম')).not.toBeInTheDocument();
    expect(screen.getByText('বর্তমান মোট বাকি:')).toBeInTheDocument();
  });

  it('hides current baki section for payment when toggled off', async () => {
    mockParams = { id: String(samplePaymentConfirmation.id) };
    renderWithAuth(<TransactionConfirmationPage />);
    await screen.findByText('COM-26');

    expect(screen.getByText('বর্তমান মোট বাকি:')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: transactionTranslationsEn['transaction.confirmation.showBaki'],
      }),
    );

    expect(screen.queryByText('বর্তমান মোট বাকি:')).not.toBeInTheDocument();
  });

  it('shows current baki for sale only after toggle', async () => {
    renderWithAuth(<TransactionConfirmationPage />);
    await screen.findByText('COM-25');

    expect(screen.queryByText('বর্তমান মোট বাকি:')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: transactionTranslationsEn['transaction.confirmation.showBaki'],
      }),
    );

    expect(screen.getByText('বর্তমান মোট বাকি:')).toBeInTheDocument();
  });

  it('calls window.print when print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderWithAuth(<TransactionConfirmationPage />);
    await screen.findByText('COM-25');

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: transactionTranslationsEn['transaction.confirmation.print'],
      }),
    );

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('shows error for initial transaction confirmation', async () => {
    mockParams = { id: '99' };
    renderWithAuth(<TransactionConfirmationPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Initial balance transactions do not have a printable confirmation.'),
      ).toBeInTheDocument();
    });
  });
});
