import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { AdminMobileNav } from './src/components/AdminSidebar';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function renderMobileNav() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

  return render(
    <LanguageProvider catalogs={{ en: adminTranslationsEn, bn: adminTranslationsBn }}>
      <AdminAuthProvider>
        <AdminMobileNav activeRoute="dashboard" onLogout={() => undefined} />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('AdminMobileNav', () => {
  it('renders an icon-only menu trigger with an accessible label', () => {
    renderMobileNav();

    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('নেভিগেশন মেনু খুলুন')).not.toBeInTheDocument();
  });
});
