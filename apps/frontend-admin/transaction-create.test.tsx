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

import { TransactionCreatePageShell } from './src/app/transactions/new/TransactionCreatePageShell';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const pushMock = vi.fn();
const replaceMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
    refresh: vi.fn(),
  }),
  usePathname: () => '/transactions/new',
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
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

const sampleCustomer = {
  id: 1,
  fullNameBn: 'রহিম',
  fullNameEn: 'Rahim',
  addressBn: 'ঠিকানা',
  addressEn: 'Address',
  phoneBn: '০১৭১২৩৪৫৬৭৮',
  phoneEn: '01712345678',
  phone: '+8801712345678',
  fatherNameBn: 'করিম',
  fatherNameEn: 'Karim',
  memoPageNumberBn: '১২৩',
  memoPageNumberEn: '123',
  mediatorNameBn: '',
  mediatorNameEn: '',
  profilePictureUrl: null,
  cachedBalance: '0.00',
  createdAt: '2026-06-24T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
};

function setupAuthenticatedTransactionHandlers() {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    http.get('*/api/admin/customers/', () =>
      HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [sampleCustomer],
      }),
    ),
    http.post('*/api/admin/transactions/', async () =>
      HttpResponse.json(
        {
          id: 10,
          customerId: 1,
          customerNameBn: 'রহিম',
          customerNameEn: 'Rahim',
          transactionType: 'PAYMENT',
          date: '2026-06-25',
          amount: '100.00',
          totalAmount: '100.00',
          note: '',
          paymentMethod: 'cash',
          balanceImpact: '-100.00',
          items: [],
          createdByName: 'admin',
          createdAt: '2026-06-25T00:00:00Z',
          updatedAt: '2026-06-25T00:00:00Z',
        },
        { status: 201 },
      ),
    ),
  );
}

describe('TransactionCreatePageShell', () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    mockSearchParams = new URLSearchParams('type=payment');
    setupAuthenticatedTransactionHandlers();
  });

  it('renders create transaction form with payment tab context', async () => {
    renderWithAuth(<TransactionCreatePageShell />);
    expect(
      await screen.findByRole('heading', {
        name: transactionTranslationsEn['transaction.create.title'],
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(transactionTranslationsEn['transaction.create.date']),
    ).toBeInTheDocument();
  });

  it('disables submit until customer and amount are provided', async () => {
    renderWithAuth(<TransactionCreatePageShell />);
    await screen.findByRole('heading', {
      name: transactionTranslationsEn['transaction.create.title'],
    });

    const submit = screen.getByRole('button', {
      name: transactionTranslationsEn['transaction.create.submit'],
    });
    expect(submit).toBeDisabled();

    const user = userEvent.setup();
    await user.click(await screen.findByText(sampleCustomer.fullNameEn));
    await user.type(
      screen.getByLabelText(transactionTranslationsEn['transaction.create.paymentAmount']),
      '100',
    );

    await waitFor(() => {
      expect(submit).not.toBeDisabled();
    });
  });

  it('adds and removes sale item rows', async () => {
    mockSearchParams = new URLSearchParams('type=sale');
    const user = userEvent.setup();
    renderWithAuth(<TransactionCreatePageShell />);
    await screen.findByRole('heading', {
      name: transactionTranslationsEn['transaction.create.title'],
    });

    await user.click(
      screen.getByRole('button', { name: transactionTranslationsEn['transaction.addItem'] }),
    );
    expect(
      screen.getAllByLabelText(transactionTranslationsEn['transaction.create.productName']),
    ).toHaveLength(2);

    const removeButtons = screen.getAllByLabelText(
      transactionTranslationsEn['transaction.create.removeItem'],
    );
    await user.click(removeButtons[1]);
    expect(
      screen.getAllByLabelText(transactionTranslationsEn['transaction.create.productName']),
    ).toHaveLength(1);
  });

  it('redirects to customer detail after successful payment', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TransactionCreatePageShell />);
    await screen.findByRole('heading', {
      name: transactionTranslationsEn['transaction.create.title'],
    });

    await user.click(await screen.findByText(sampleCustomer.fullNameEn));
    await user.type(
      screen.getByLabelText(transactionTranslationsEn['transaction.create.paymentAmount']),
      '100',
    );
    await user.click(
      screen.getByRole('button', { name: transactionTranslationsEn['transaction.create.submit'] }),
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/customers/1?success=transactionCreated');
    });
  });
});
