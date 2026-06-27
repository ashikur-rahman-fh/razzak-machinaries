import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { TemporaryPasswordPanel } from './src/staff/components/TemporaryPasswordPanel';
import { staffTranslationsBn, staffTranslationsEn } from './src/i18n/staff-translations';
import { server } from './vitest.setup';

function renderPanel() {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');

  return render(
    <LanguageProvider catalogs={{ en: staffTranslationsEn, bn: staffTranslationsBn }}>
      <TemporaryPasswordPanel password="Razzak-8392-Kolom!" />
    </LanguageProvider>,
  );
}

describe('TemporaryPasswordPanel', () => {
  it('shows one-time password warning and value', () => {
    renderPanel();

    expect(screen.getByTestId('temporary-password-panel')).toBeInTheDocument();
    expect(screen.getByTestId('temporary-password-value')).toHaveTextContent('Razzak-8392-Kolom!');
    expect(screen.getByText(/only be shown once/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
  });
});

describe('Staff users API handlers', () => {
  it('supports mocked staff list endpoint', async () => {
    server.use(
      http.get('*/api/admin/staff-users/', () =>
        HttpResponse.json({
          count: 1,
          page: 1,
          pageSize: 25,
          results: [
            {
              id: 2,
              name: 'Karim Ahmed',
              firstName: 'Karim',
              lastName: 'Ahmed',
              username: 'karim',
              email: 'karim@example.com',
              phone: '',
              isActive: true,
              isStaff: true,
              isSuperuser: false,
              mustChangePassword: true,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
              createdByName: 'Admin User',
              updatedByName: 'Admin User',
            },
          ],
        }),
      ),
    );

    const response = await fetch('/api/admin/staff-users/');
    const body = await response.json();
    expect(body.results[0].username).toBe('karim');
  });
});
