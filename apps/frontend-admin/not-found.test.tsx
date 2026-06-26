import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import NotFound from './src/app/not-found';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import {
  dashboardTranslationsBn,
  dashboardTranslationsEn,
} from './src/i18n/dashboard-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/not-found',
  useSearchParams: () => new URLSearchParams(),
}));

function renderNotFound() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'en');
  return render(
    <LanguageProvider
      catalogs={{
        en: {
          ...adminTranslationsEn,
          ...dashboardTranslationsEn,
          ...geoTranslationsEn,
          ...customerTranslationsEn,
        },
        bn: {
          ...adminTranslationsBn,
          ...dashboardTranslationsBn,
          ...geoTranslationsBn,
          ...customerTranslationsBn,
        },
      }}
    >
      <AdminAuthProvider>
        <NotFound />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('NotFound page', () => {
  it('renders branded not-found content and recovery links', () => {
    renderNotFound();

    expect(screen.getByTestId('admin-not-found-page')).toBeInTheDocument();
    expect(screen.getByText(adminTranslationsEn['notFound.title'])).toBeInTheDocument();
    expect(screen.getByText(adminTranslationsEn['notFound.description'])).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: adminTranslationsEn['notFound.backToProfile'] }),
    ).toHaveAttribute('href', '/profile');
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: adminTranslationsEn['notFound.viewCustomers'] }),
    ).toHaveAttribute('href', '/customers');
    expect(
      screen.getByRole('link', { name: adminTranslationsEn['notFound.viewBangladeshAddress'] }),
    ).toHaveAttribute('href', '/bangladesh-address');
  });
});
