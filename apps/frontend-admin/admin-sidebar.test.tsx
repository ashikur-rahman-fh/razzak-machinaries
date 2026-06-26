import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminMobileNav } from './src/components/AdminSidebar';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function renderMobileNav() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');

  return render(
    <LanguageProvider catalogs={{ en: adminTranslationsEn, bn: adminTranslationsBn }}>
      <AdminMobileNav activeRoute="dashboard" />
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
