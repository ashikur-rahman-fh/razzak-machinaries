import { setAdminCsrfToken, type Transaction } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  type LanguagePreference,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomersListPage } from './src/app/customers/CustomersListPage';
import { CustomerDetailPage } from './src/app/customers/[id]/CustomerDetailPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { paginatedCustomers, sampleCustomer } from './src/customers/customer-fixtures';
import { customerMswHandlers } from './src/customers/customer-msw-handlers';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server, staffUser } from './vitest.setup';
import { withVersionFields } from './src/transactions/transaction-msw-handlers';

const sampleTransactions: Transaction[] = [
  withVersionFields({
    id: 1,
    customerId: sampleCustomer.id,
    customerNameBn: sampleCustomer.fullNameBn,
    customerNameEn: sampleCustomer.fullNameEn,
    transactionType: 'SALE',
    date: '2026-06-25',
    amount: '12000.00',
    totalAmount: '12000.00',
    note: '',
    paymentMethod: '',
    balanceImpact: '+12000.00',
    items: [],
    createdByName: null,
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-06-25T10:00:00Z',
  }),
  withVersionFields({
    id: 2,
    customerId: sampleCustomer.id,
    customerNameBn: sampleCustomer.fullNameBn,
    customerNameEn: sampleCustomer.fullNameEn,
    transactionType: 'PAYMENT',
    date: '2026-06-24',
    amount: '50.00',
    totalAmount: '50.00',
    note: '',
    paymentMethod: 'cash',
    balanceImpact: '-50.00',
    items: [],
    createdByName: null,
    createdAt: '2026-06-24T10:00:00Z',
    updatedAt: '2026-06-24T10:00:00Z',
  }),
  withVersionFields({
    id: 3,
    customerId: sampleCustomer.id,
    customerNameBn: sampleCustomer.fullNameBn,
    customerNameEn: sampleCustomer.fullNameEn,
    transactionType: 'INITIAL',
    date: '2026-06-20',
    amount: '100.00',
    totalAmount: '100.00',
    note: 'halkhata 2026',
    paymentMethod: '',
    balanceImpact: '+100.00',
    items: [],
    createdByName: null,
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
  }),
];

const pushMock = vi.fn();
const replaceMock = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockParams: Record<string, string> = { id: String(sampleCustomer.id) };

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
    refresh: vi.fn(),
  }),
  usePathname: () => `/customers/${mockParams.id ?? ''}`,
  useSearchParams: () => mockSearchParams,
  useParams: () => mockParams,
}));

function setLanguagePreference(preference: LanguagePreference) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
}

function renderWithAuth(
  ui: ReactElement,
  preference: LanguagePreference = { language: 'en', displayMode: 'en' },
) {
  setLanguagePreference(preference);
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

function setupAuthenticatedCustomers() {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    ...customerMswHandlers,
  );
}

describe('CustomersListPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    mockSearchParams = new URLSearchParams();
    mockParams = { id: String(sampleCustomer.id) };
    setupAuthenticatedCustomers();
  });

  it('renders customer list with rows', async () => {
    renderWithAuth(<CustomersListPage />);
    expect(await screen.findByTestId('customers-list-page')).toBeInTheDocument();
    const card = await screen.findByTestId(`customer-card-${sampleCustomer.id}`);
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent(sampleCustomer.fullNameEn);
  });

  it('keeps secondary customer fields in a collapsed details section', async () => {
    renderWithAuth(<CustomersListPage />);
    const card = await screen.findByTestId(`customer-card-${sampleCustomer.id}`);
    expect(
      within(card).getByText(customerTranslationsEn['customer.list.moreDetails']),
    ).toBeInTheDocument();
    expect(within(card).queryByText(sampleCustomer.fatherNameEn)).not.toBeVisible();
  });

  it('updates URL when search input changes', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomersListPage />);
    await screen.findByTestId('customer-search-input');

    await user.type(screen.getByTestId('customer-search-input'), 'rahim');

    await waitFor(() => {
      const relevanceCall = pushMock.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('search=rahim') &&
          call[0].includes('ordering=relevance'),
      );
      expect(relevanceCall).toBeDefined();
    });
  });

  it('shows empty search state with clear action', async () => {
    mockSearchParams = new URLSearchParams('search=nomatch');
    renderWithAuth(<CustomersListPage />);
    expect(
      await screen.findByText(customerTranslationsEn['customer.list.emptySearch']),
    ).toBeInTheDocument();
    expect(screen.getByTestId('customer-search-clear')).toBeInTheDocument();
  });

  it('shows both languages on pagination summary and sort control when display mode is both', async () => {
    mockSearchParams = new URLSearchParams('search=nomatch');
    renderWithAuth(<CustomersListPage />, { language: 'en', displayMode: 'both' });

    expect(await screen.findByTestId('customers-list-page')).toBeInTheDocument();
    expect(document.documentElement.dataset.contentDisplay).toBe('both');

    expect(
      screen.getByText(customerTranslationsEn['customer.pagination.summaryEmpty']),
    ).toBeInTheDocument();
    expect(
      screen.getByText(customerTranslationsBn['customer.pagination.summaryEmpty']),
    ).toHaveAttribute('lang', 'bn');

    const sortTrigger = screen.getByRole('combobox', { name: 'Sort customers' });
    expect(sortTrigger).toHaveAttribute('data-slot', 'select-trigger');
    expect(sortTrigger).toHaveTextContent(customerTranslationsEn['customer.list.sort.newest']);
    expect(sortTrigger).toHaveTextContent(customerTranslationsBn['customer.list.sort.newest']);
  });
});

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    mockSearchParams = new URLSearchParams();
    mockParams = { id: String(sampleCustomer.id) };
    setupAuthenticatedCustomers();
  });

  it('renders customer detail sections', async () => {
    renderWithAuth(<CustomerDetailPage />);
    const content = await screen.findByTestId('customer-detail-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent(sampleCustomer.fullNameBn);
    expect(content).toHaveTextContent(sampleCustomer.fatherNameEn);
    expect(
      screen.getByRole('link', { name: customerTranslationsEn['customer.history.view'] }),
    ).toBeInTheDocument();
  });

  it('hides View Customer History for staff users', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(staffUser)));
    renderWithAuth(<CustomerDetailPage />);
    const content = await screen.findByTestId('customer-detail-content');
    expect(content).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: customerTranslationsEn['customer.history.view'] }),
    ).not.toBeInTheDocument();
  });

  it('shows archive confirmation modal before archive', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomerDetailPage />);
    const content = await screen.findByTestId('customer-detail-content');

    const archiveButtons = within(content).getAllByRole('button', {
      name: customerTranslationsEn['customer.actions.archive'],
    });
    await user.click(archiveButtons[0]!);

    expect(await screen.findByTestId('confirm-dialog-confirm')).toBeInTheDocument();
  });

  it('renders recent transactions in a table with aligned columns', async () => {
    server.use(
      http.get('*/api/admin/customers/:id/transactions/', () =>
        HttpResponse.json(paginatedCustomers(sampleTransactions)),
      ),
    );

    renderWithAuth(<CustomerDetailPage />);
    await screen.findByTestId('customer-detail-content');
    await screen.findByText('halkhata 2026');

    const table = screen.getByRole('table');
    expect(within(table).getByText('Type')).toBeInTheDocument();
    expect(within(table).getByText('Date')).toBeInTheDocument();
    expect(within(table).getByText('Note')).toBeInTheDocument();
    expect(within(table).getByText('Amount')).toBeInTheDocument();

    expect(within(table).getAllByRole('row')).toHaveLength(1);

    const dataRows = within(table).getAllByRole('link');
    expect(dataRows).toHaveLength(3);

    const saleCells = within(dataRows[0]!).getAllByRole('cell');
    expect(saleCells[0]).toHaveTextContent(transactionTranslationsEn['transaction.type.sale']);
    expect(saleCells[1]).toHaveTextContent('2026-06-25');
    expect(saleCells[2]).toHaveTextContent('—');
    expect(saleCells[3]).toHaveTextContent('+');

    const paymentCells = within(dataRows[1]!).getAllByRole('cell');
    expect(paymentCells[1]).toHaveTextContent('2026-06-24');
    expect(paymentCells[3]).toHaveTextContent('-');

    const initialCells = within(dataRows[2]!).getAllByRole('cell');
    expect(initialCells[1]).toHaveTextContent('2026-06-20');
    expect(initialCells[2]).toHaveTextContent('halkhata 2026');
    expect(initialCells[3]).toHaveTextContent('+');
  });
});
