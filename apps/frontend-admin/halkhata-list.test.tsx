import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HalkhataListPage } from './src/app/halkhata/HalkhataListPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { buildListUrl, parseListState } from './src/halkhata/routes';
import { halkhataMswHandlers } from './src/halkhata/halkhata-msw-handlers';
import { halkhataTranslationsBn, halkhataTranslationsEn } from './src/i18n/halkhata-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const push = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/halkhata',
  useSearchParams: () => mockSearchParams,
}));

function renderListPage() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...halkhataMswHandlers(),
  );

  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...halkhataTranslationsEn },
        bn: { ...adminTranslationsBn, ...halkhataTranslationsBn },
      }}
    >
      <AdminAuthProvider>
        <HalkhataListPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('HalkhataListPage', () => {
  beforeEach(() => {
    push.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it('renders halkhata list with create button', async () => {
    renderListPage();
    expect(await screen.findByRole('heading', { name: /Halkhata/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Halkhata/i })).toBeInTheDocument();
    expect(await screen.findByText('Summer Collection 2026')).toBeInTheDocument();
  });

  it('renders status filter and shows all halkhatas by default', async () => {
    renderListPage();
    expect(await screen.findByText('Summer Collection 2026')).toBeInTheDocument();
    expect(screen.getByText('Winter Collection 2025')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument();
  });

  it('shows only closed halkhatas when closed status is in URL', async () => {
    mockSearchParams = new URLSearchParams('status=closed');
    renderListPage();
    expect(await screen.findByText('Winter Collection 2025')).toBeInTheDocument();
    expect(screen.queryByText('Summer Collection 2026')).not.toBeInTheDocument();
  });

  it('builds list URLs with status filter', () => {
    expect(buildListUrl({ status: 'closed', page: 1 })).toBe('/halkhata?status=closed');
    expect(parseListState(new URLSearchParams('status=active'))).toEqual({
      page: 1,
      status: 'active',
    });
    expect(parseListState(new URLSearchParams('status=invalid'))).toEqual({
      page: 1,
      status: '',
    });
  });

  it('validates create modal required fields', async () => {
    const user = userEvent.setup();
    renderListPage();
    await screen.findByText('Summer Collection 2026');

    await user.click(screen.getByRole('button', { name: /Create Halkhata/i }));
    await user.click(screen.getByRole('dialog').querySelector('button[type="submit"]')!);

    expect(await screen.findByText(/Halkhata name is required/i)).toBeInTheDocument();
  });

  it('redirects to detail page after successful create', async () => {
    const user = userEvent.setup();
    renderListPage();
    await screen.findByText('Summer Collection 2026');

    await user.click(screen.getByRole('button', { name: /Create Halkhata/i }));
    await user.type(screen.getByLabelText(/Halkhata name/i), 'New Session');
    await user.click(screen.getByRole('dialog').querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/halkhata/3');
    });
  });
});
