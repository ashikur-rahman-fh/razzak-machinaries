import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { AdminMobileNav } from './src/components/AdminSidebar';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import {
  editHistoryTranslationsBn,
  editHistoryTranslationsEn,
} from './src/i18n/edit-history-translations';
import { staffTranslationsBn, staffTranslationsEn } from './src/i18n/staff-translations';
import { adminUser, server, staffUser } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function renderMobileNav(user = adminUser) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(user)));

  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...editHistoryTranslationsEn, ...staffTranslationsEn },
        bn: { ...adminTranslationsBn, ...editHistoryTranslationsBn, ...staffTranslationsBn },
      }}
    >
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

  it('includes the Edit History navigation item', async () => {
    const user = userEvent.setup();
    renderMobileNav();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByRole('link', { name: /Edit History/i })).toHaveAttribute(
      'href',
      '/edit-history',
    );
  });

  it('hides Edit History for staff users', async () => {
    const user = userEvent.setup();
    renderMobileNav(staffUser);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.queryByRole('link', { name: /Edit History/i })).not.toBeInTheDocument();
  });

  it('includes Staff users navigation for superusers', async () => {
    const user = userEvent.setup();
    renderMobileNav();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByRole('link', { name: /Staff users/i })).toHaveAttribute(
      'href',
      '/staff-users',
    );
  });

  it('hides Staff users navigation for staff users', async () => {
    const user = userEvent.setup();
    renderMobileNav(staffUser);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.queryByRole('link', { name: /Staff users/i })).not.toBeInTheDocument();
  });
});
