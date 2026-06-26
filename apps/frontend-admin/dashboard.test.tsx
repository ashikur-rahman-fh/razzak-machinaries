import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { DashboardPage } from './src/dashboard/DashboardPage';
import { dashboardMswHandlers } from './src/dashboard/dashboard-msw-handlers';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import {
  dashboardTranslationsBn,
  dashboardTranslationsEn,
} from './src/i18n/dashboard-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function renderDashboard() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'en');
  setAdminCsrfToken('test-csrf-token');

  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...dashboardTranslationsEn,
          ...geoTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...dashboardTranslationsBn,
          ...geoTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>
        <DashboardPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
      ...dashboardMswHandlers(),
    );
  });

  it('renders KPI values and recent data', async () => {
    renderDashboard();

    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
    expect(await screen.findByTestId('dashboard-kpi-totalDue')).toHaveTextContent('1,700');
    expect(screen.getAllByText('Ali').length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: dashboardTranslationsEn['dashboard.action.view'] })[0],
    ).toHaveAttribute('href', '/transactions/2');
  });

  it('shows dashboard as first sidebar link', async () => {
    renderDashboard();
    await screen.findByTestId('dashboard-page');

    const dashboardNavLink = screen.getByRole('navigation', { name: 'Admin navigation' });
    const currentPageLink = within(dashboardNavLink).getByRole('link', { name: 'Dashboard' });
    expect(currentPageLink).toHaveAttribute('href', '/');
    expect(currentPageLink).toHaveAttribute('aria-current', 'page');

    const brandHomeLink = screen
      .getAllByRole('link', { name: 'Dashboard' })
      .find((link) => link.getAttribute('href') === '/' && !link.closest('nav'));
    expect(brandHomeLink).toBeDefined();
  });

  it('renders year selector with available years', async () => {
    renderDashboard();
    const yearSelect = await screen.findByTestId('dashboard-year-select');
    expect(yearSelect).toBeInTheDocument();
    expect(yearSelect).toHaveTextContent('2026');
  });

  it('shows error state with retry', async () => {
    server.use(
      http.get('*/api/admin/dashboard/', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed', details: {} },
          },
          { status: 500 },
        ),
      ),
    );

    renderDashboard();
    expect(
      await screen.findByText(dashboardTranslationsEn['dashboard.loadError']),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: dashboardTranslationsEn['dashboard.retry'] }),
    ).toBeInTheDocument();
  });
});
