import { describe, expect, it, vi } from 'vitest';

import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EditHistoryPage } from './src/app/edit-history/EditHistoryPage';
import { editHistoryMswHandlers } from './src/edit-history/edit-history-msw-handlers';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import {
  editHistoryTranslationsBn,
  editHistoryTranslationsEn,
} from './src/i18n/edit-history-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import {
  transactionTranslationsBn,
  transactionTranslationsEn,
} from './src/i18n/transaction-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/edit-history',
  useSearchParams: () => new URLSearchParams(),
}));

function renderEditHistoryPage() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...editHistoryMswHandlers(),
  );

  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...editHistoryTranslationsEn,
          ...customerTranslationsEn,
          ...transactionTranslationsEn,
          ...geoTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...editHistoryTranslationsBn,
          ...customerTranslationsBn,
          ...transactionTranslationsBn,
          ...geoTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>
        <EditHistoryPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('EditHistoryPage', () => {
  it('renders edit history events with links to detail pages', async () => {
    renderEditHistoryPage();

    expect(await screen.findByTestId('edit-history-page')).toBeInTheDocument();
    expect(screen.getByTestId('edit-history-table')).toBeInTheDocument();
    expect(screen.getByText('Duplicate entry')).toBeInTheDocument();

    const voidRow = screen.getByText('COM-6').closest('tr');
    expect(voidRow).not.toBeNull();
    const viewLink = within(voidRow as HTMLElement).getByRole('link', { name: /View/i });
    expect(viewLink).toHaveAttribute('href', '/transactions/6?from=edit-history');

    const archiveRow = screen.getByText('Inactive Customer').closest('tr');
    expect(archiveRow).not.toBeNull();
    const customerLink = within(archiveRow as HTMLElement).getByRole('link', { name: /View/i });
    expect(customerLink).toHaveAttribute('href', '/customers/99?from=edit-history');
  });

  it('shows event type filter control', async () => {
    renderEditHistoryPage();

    await screen.findByTestId('edit-history-table');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
