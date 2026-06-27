import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomerDetailPage } from './src/app/customers/[id]/CustomerDetailPage';
import { DashboardPage } from './src/dashboard/DashboardPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerMswHandlers } from './src/customers/customer-msw-handlers';
import { dashboardMswHandlers } from './src/dashboard/dashboard-msw-handlers';
import { followUpMswHandlers } from './src/follow-ups/follow-up-msw-handlers';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import {
  dashboardTranslationsBn,
  dashboardTranslationsEn,
} from './src/i18n/dashboard-translations';
import { followUpTranslationsBn, followUpTranslationsEn } from './src/i18n/follow-up-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/customers/42',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '42' }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

function renderWithProviders(ui: React.ReactElement) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'en');
  setAdminCsrfToken('test-csrf-token');

  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
          ...dashboardTranslationsEn,
          ...followUpTranslationsEn,
          ...geoTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
          ...dashboardTranslationsBn,
          ...followUpTranslationsBn,
          ...geoTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

function setupAuthenticatedFollowUps() {
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...customerMswHandlers,
    ...followUpMswHandlers(),
  );
}

function setupAuthenticatedDashboard() {
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...dashboardMswHandlers(),
    ...followUpMswHandlers(),
  );
}

describe('follow-ups', () => {
  beforeEach(() => {
    setupAuthenticatedFollowUps();
  });

  it('renders active follow-up on customer detail page', async () => {
    renderWithProviders(<CustomerDetailPage />);

    const card = await screen.findByTestId('follow-up-card');
    expect(within(card).getByText('Call about payment')).toBeInTheDocument();
    expect(within(card).getAllByText('Admin User').length).toBeGreaterThan(0);
    expect(within(card).getByText('Today')).toBeInTheDocument();
  });

  it('opens follow-up modal and submits reschedule from customer detail', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerDetailPage />);

    const card = await screen.findByTestId('follow-up-card');
    await user.click(within(card).getByRole('button', { name: 'Reschedule' }));
    expect(screen.getByTestId('follow-up-modal')).toBeInTheDocument();

    const dateInput = screen.getByTestId('follow-up-date-input');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-07-01');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByTestId('follow-up-modal')).not.toBeInTheDocument();
    });
  });

  it('shows follow-up history when toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerDetailPage />);

    const card = await screen.findByTestId('follow-up-card');
    await user.click(within(card).getByRole('button', { name: 'View History' }));

    const historyTable = await screen.findByTestId('follow-up-history-table');
    expect(within(historyTable).getByText('Earlier follow-up')).toBeInTheDocument();
  });
});

describe('dashboard follow-ups', () => {
  beforeEach(() => {
    setupAuthenticatedDashboard();
  });

  it('renders dashboard follow-ups section with overdue badge', async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId('dashboard-page');
    const section = await screen.findByTestId('dashboard-follow-ups');
    const row = await within(section).findByTestId('dashboard-follow-up-row-10');
    expect(within(row).getByText('Overdue')).toBeInTheDocument();
    const todayRow = await within(section).findByTestId('dashboard-follow-up-row-11');
    expect(within(todayRow).getByText('Today')).toBeInTheDocument();
  });

  it('completes a follow-up from dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId('dashboard-page');
    const section = await screen.findByTestId('dashboard-follow-ups');
    const row = await within(section).findByTestId('dashboard-follow-up-row-10');
    await user.click(within(row).getByRole('button', { name: 'Mark Completed' }));

    await waitFor(() => {
      expect(screen.getByText('Mark follow-up as completed')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Mark Completed' }));

    await waitFor(() => {
      expect(screen.queryByText('Mark follow-up as completed')).not.toBeInTheDocument();
    });
  });
});
