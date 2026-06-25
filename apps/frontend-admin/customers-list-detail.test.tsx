import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
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
import { sampleCustomer } from './src/customers/customer-fixtures';
import { customerMswHandlers } from './src/customers/customer-msw-handlers';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

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
        en: { ...adminTranslationsEn, ...geoTranslationsEn, ...customerTranslationsEn },
        bn: { ...adminTranslationsBn, ...geoTranslationsBn, ...customerTranslationsBn },
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
  });

  it('shows delete confirmation modal before delete', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomerDetailPage />);
    const content = await screen.findByTestId('customer-detail-content');

    const deleteButtons = within(content).getAllByRole('button', {
      name: customerTranslationsEn['customer.actions.delete'],
    });
    await user.click(deleteButtons[0]!);

    expect(await screen.findByTestId('confirm-dialog-confirm')).toBeInTheDocument();
  });
});
