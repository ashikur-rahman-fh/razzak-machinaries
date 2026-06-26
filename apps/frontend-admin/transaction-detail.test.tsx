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

import { TransactionDetailPage } from './src/app/transactions/[id]/TransactionDetailPage';
import { TransactionConfirmationPage } from './src/app/transactions/[id]/confirmation/TransactionConfirmationPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { TransactionTable } from './src/transactions/components/TransactionTable';
import {
  sampleInitialTransaction,
  samplePaymentTransaction,
  sampleSaleTransaction,
  transactionMswHandlers,
} from './src/transactions/transaction-msw-handlers';
import { adminUser, server, staffUser } from './vitest.setup';

const pushMock = vi.fn();
let mockParams = { id: String(sampleSaleTransaction.id) };
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: pushMock,
    refresh: vi.fn(),
  }),
  usePathname: () => `/transactions/${mockParams.id}`,
  useSearchParams: () => mockSearchParams,
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

function setupAuthenticatedTransactionHandlers(user = adminUser) {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(user)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    ...transactionMswHandlers,
  );
}

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockParams = { id: String(sampleSaleTransaction.id) };
    mockSearchParams = new URLSearchParams();
    setupAuthenticatedTransactionHandlers();
  });

  it('renders sale transaction with items and print button', async () => {
    renderWithAuth(<TransactionDetailPage />);

    expect(await screen.findByTestId('transaction-detail-content')).toBeInTheDocument();
    expect(screen.getByText('Sale')).toBeInTheDocument();
    expect(screen.getByText('ট্রাক্টর পার্টস')).toBeInTheDocument();
    expect(screen.getByText('Machinery parts')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: transactionTranslationsEn['transaction.confirmation.print'],
      }),
    ).toHaveAttribute('href', '/transactions/25/confirmation?from=detail');
  });

  it('renders payment transaction with payment method and print button', async () => {
    mockParams = { id: String(samplePaymentTransaction.id) };
    renderWithAuth(<TransactionDetailPage />);

    await screen.findByTestId('transaction-detail-content');
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Partial payment')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: transactionTranslationsEn['transaction.confirmation.print'],
      }),
    ).toBeInTheDocument();
  });

  it('renders initial transaction without print button', async () => {
    mockParams = { id: String(sampleInitialTransaction.id) };
    renderWithAuth(<TransactionDetailPage />);

    await screen.findByTestId('transaction-detail-content');
    expect(screen.getByText('Initial Balance')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: transactionTranslationsEn['transaction.confirmation.print'],
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(transactionTranslationsEn['transaction.confirmation.notAvailable']),
    ).toBeInTheDocument();
  });

  it('shows not found for missing transaction', async () => {
    mockParams = { id: '404' };
    renderWithAuth(<TransactionDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(transactionTranslationsEn['transaction.detail.notFound']),
      ).toBeInTheDocument();
    });
  });

  it('shows not found for invalid transaction id', async () => {
    mockParams = { id: 'abc' };
    renderWithAuth(<TransactionDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(transactionTranslationsEn['transaction.detail.notFound']),
      ).toBeInTheDocument();
    });
  });

  it('shows View History for superusers', async () => {
    renderWithAuth(<TransactionDetailPage />);
    await screen.findByTestId('transaction-detail-content');
    expect(
      screen.getByRole('link', { name: transactionTranslationsEn['transaction.history.view'] }),
    ).toBeInTheDocument();
  });

  it('hides version context and View History for staff users', async () => {
    setupAuthenticatedTransactionHandlers(staffUser);
    renderWithAuth(<TransactionDetailPage />);
    await screen.findByTestId('transaction-detail-content');
    expect(
      screen.queryByRole('link', { name: transactionTranslationsEn['transaction.history.view'] }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Version/i)).not.toBeInTheDocument();
  });
});

describe('TransactionTable navigation', () => {
  beforeEach(() => {
    pushMock.mockClear();
    setupAuthenticatedTransactionHandlers();
  });

  it('navigates to transaction detail when row is clicked', async () => {
    renderWithAuth(<TransactionTable transactions={[sampleSaleTransaction]} />);

    const user = userEvent.setup();
    await user.click(screen.getByTestId(`transaction-row-${sampleSaleTransaction.id}`));

    expect(pushMock).toHaveBeenCalledWith('/transactions/25');
  });
});

describe('TransactionConfirmationPage from detail', () => {
  beforeEach(() => {
    mockParams = { id: String(sampleSaleTransaction.id) };
    mockSearchParams = new URLSearchParams('from=detail');
    setupAuthenticatedTransactionHandlers();
  });

  it('shows back to transaction link when opened from detail', async () => {
    renderWithAuth(<TransactionConfirmationPage />);

    await screen.findByText('COM-25');
    expect(
      screen.getByRole('link', {
        name: transactionTranslationsEn['transaction.confirmation.backToTransaction'],
      }),
    ).toHaveAttribute('href', '/transactions/25');
  });
});
