import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { HalkhataDetailPage } from './src/app/halkhata/[id]/HalkhataDetailPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerMswHandlers } from './src/customers/customer-msw-handlers';
import { sampleCustomer } from './src/customers/customer-fixtures';
import { halkhataMswHandlers } from './src/halkhata/halkhata-msw-handlers';
import { sampleHalkhata, sampleHalkhataTransactions } from './src/halkhata/halkhata-fixtures';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { halkhataTranslationsBn, halkhataTranslationsEn } from './src/i18n/halkhata-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/halkhata/1',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '1' }),
}));

function renderDetailPage(status: 'active' | 'closed' = 'active') {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  sessionStorage.clear();
  mockPush.mockReset();
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...halkhataMswHandlers({ status }),
    ...customerMswHandlers,
  );

  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...customerTranslationsEn,
          ...halkhataTranslationsEn,
          ...transactionTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...customerTranslationsBn,
          ...halkhataTranslationsBn,
          ...transactionTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>
        <HalkhataDetailPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('HalkhataDetailPage', () => {
  it('renders halkhata detail with stats and transactions', async () => {
    renderDetailPage();
    expect(await screen.findByRole('heading', { name: sampleHalkhata.title })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', {
        name: `${sampleHalkhataTransactions[0].customerNameEn}, payment ${sampleHalkhataTransactions[0].paymentNumber}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Total collected/i).length).toBeGreaterThan(0);
  });

  it('navigates to transaction detail when payment row is clicked', async () => {
    const user = userEvent.setup();
    renderDetailPage();
    await screen.findByRole('heading', { name: sampleHalkhata.title });

    const paymentRow = await screen.findByTestId(
      `halkhata-payment-row-${sampleHalkhataTransactions[0].id}`,
    );
    await user.click(paymentRow);

    expect(mockPush).toHaveBeenCalledWith(`/transactions/${sampleHalkhataTransactions[0].id}`);
  });

  it('shows closed banner and disables search when closed', async () => {
    renderDetailPage('closed');
    expect(await screen.findByRole('button', { name: /Reopen Halkhata/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name/i)).toBeDisabled();
  });

  it('opens payment modal from customer search', async () => {
    const user = userEvent.setup();
    renderDetailPage();
    await screen.findByRole('heading', { name: sampleHalkhata.title });

    const searchInput = screen.getByTestId('halkhata-customer-search-input');
    await user.type(searchInput, 'Rahim');

    const customerButton = await screen.findByRole('button', { name: /Rahim Uddin/i });
    await user.click(customerButton);

    expect(await screen.findByRole('dialog', { name: /Record payment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete payment/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /Confirm payment/i })).not.toBeInTheDocument();
  });

  it('shows customer summary grid with bilingual due label in payment modal', async () => {
    const user = userEvent.setup();
    renderDetailPage();
    await screen.findByRole('heading', { name: sampleHalkhata.title });

    const searchInput = screen.getByTestId('halkhata-customer-search-input');
    await user.type(searchInput, 'Rahim');

    const customerButton = await screen.findByRole('button', { name: /Rahim Uddin/i });
    await user.click(customerButton);

    const summary = await screen.findByTestId('halkhata-payment-customer-summary');
    expect(summary).toBeInTheDocument();
    expect(within(summary).getByText('Due / বাকি')).toBeInTheDocument();
    expect(within(summary).getByText(sampleCustomer.fullNameEn)).toBeInTheDocument();
    expect(within(summary).getByText(sampleCustomer.mediatorNameEn)).toBeInTheDocument();
    expect(within(summary).getByText(sampleCustomer.phoneEn)).toBeInTheDocument();
  });

  it('shows selected customer in recent customers panel', async () => {
    const user = userEvent.setup();
    renderDetailPage();
    await screen.findByRole('heading', { name: sampleHalkhata.title });

    const searchInput = screen.getByTestId('halkhata-customer-search-input');
    await user.type(searchInput, 'Rahim');

    const customerButton = await screen.findByRole('button', { name: /Rahim Uddin/i });
    await user.click(customerButton);

    expect(await screen.findByTestId('halkhata-recent-customer-42')).toBeInTheDocument();
    expect(screen.getByText(/Recent customers/i)).toBeInTheDocument();
  });

  it('clears customer search after successful payment', async () => {
    const user = userEvent.setup();
    renderDetailPage();
    await screen.findByRole('heading', { name: sampleHalkhata.title });

    const searchInput = screen.getByTestId('halkhata-customer-search-input');
    await user.type(searchInput, 'Rahim');

    const customerButton = await screen.findByRole('button', { name: /Rahim Uddin/i });
    await user.click(customerButton);

    const dialog = await screen.findByRole('dialog', { name: /Record payment/i });
    const amountInput = dialog.querySelector('#transaction-payment-amount');
    expect(amountInput).toBeTruthy();
    await user.type(amountInput!, '250');

    await user.click(screen.getByRole('button', { name: /Complete payment/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Record payment/i })).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('halkhata-customer-search-input')).toHaveValue('');
  });
});
