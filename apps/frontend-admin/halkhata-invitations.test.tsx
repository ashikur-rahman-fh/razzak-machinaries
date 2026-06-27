import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { PreHalkhataInvitationPage } from './src/app/halkhata/[id]/invitations/PreHalkhataInvitationPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { halkhataMswHandlers } from './src/halkhata/halkhata-msw-handlers';
import { sampleInvitationCustomers } from './src/halkhata/invitation-fixtures';
import { halkhataTranslationsBn, halkhataTranslationsEn } from './src/i18n/halkhata-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/halkhata/1/invitations',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '1' }),
}));

function renderInvitationsPage(status: 'active' | 'closed' = 'active') {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
  mockPush.mockReset();
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    ...halkhataMswHandlers({ status }),
  );

  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...halkhataTranslationsEn },
        bn: { ...adminTranslationsBn, ...halkhataTranslationsBn },
      }}
    >
      <AdminAuthProvider>
        <PreHalkhataInvitationPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('PreHalkhataInvitationPage', () => {
  it('renders invitation summary and customer selector', async () => {
    renderInvitationsPage();
    expect(
      await screen.findByRole('heading', { name: /Pre-Halkhata Invitations/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(sampleInvitationCustomers[0].fullNameEn)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate New Version/i })).toBeInTheDocument();
  });

  it('disables generate when no customer is selected', async () => {
    renderInvitationsPage();
    await screen.findByRole('heading', { name: /Pre-Halkhata Invitations/i });
    await userEvent.click(screen.getByRole('button', { name: /Clear selection/i }));
    expect(screen.getByRole('button', { name: /Generate New Version/i })).toBeDisabled();
  });

  it('generates invitations and navigates to print page', async () => {
    renderInvitationsPage();
    await screen.findByRole('heading', { name: /Pre-Halkhata Invitations/i });
    const checkbox = screen.getByRole('checkbox', {
      name: sampleInvitationCustomers[0].fullNameEn,
    });
    await userEvent.click(checkbox);
    await userEvent.click(screen.getByRole('button', { name: /Generate New Version/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/halkhata/1/invitations/print/11');
    });
  });

  it('shows read-only banner for closed halkhata', async () => {
    renderInvitationsPage('closed');
    expect(await screen.findByText(/cannot create new ones/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate New Version/i })).toBeDisabled();
  });
});
