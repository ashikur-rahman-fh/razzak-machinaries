import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { InvitationPrintPage } from './src/app/halkhata/[id]/invitations/print/[generationId]/InvitationPrintPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { halkhataMswHandlers } from './src/halkhata/halkhata-msw-handlers';
import { sampleInvitationGeneration } from './src/halkhata/invitation-fixtures';
import { halkhataTranslationsBn, halkhataTranslationsEn } from './src/i18n/halkhata-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/halkhata/1/invitations/print/10',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: '1', generationId: '10' }),
}));

function renderPrintPage() {
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
        <InvitationPrintPage />
      </AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('InvitationPrintPage', () => {
  it('renders invitation card with personalized Bangla message', async () => {
    renderPrintPage();
    expect(await screen.findByText('হালখাতার দাওয়াতনামা')).toBeInTheDocument();
    expect(screen.getByText(/প্রিয় রহিম/)).toBeInTheDocument();
    expect(screen.getByText(sampleInvitationGeneration.halkhataTitle)).toBeInTheDocument();
  });

  it('wraps each invitation in an A4 page shell with flex body', async () => {
    const { container } = renderPrintPage();
    await screen.findByText('হালখাতার দাওয়াতনামা');
    expect(container.querySelector('.invitation-page')).toBeInTheDocument();
    expect(container.querySelector('.invitation-card__body')).toBeInTheDocument();
    expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
  });

  it('uses half-page shells when 2 per page layout is selected', async () => {
    const twoRecipientGeneration = {
      ...sampleInvitationGeneration,
      customerCount: 2,
      recipients: [
        sampleInvitationGeneration.recipients[0],
        {
          customerId: 43,
          customerNameSnapshot: 'করিম',
          phoneSnapshot: '০১৭২২২২২২২২২',
          addressSnapshot: 'আত্রাই',
          fatherNameSnapshot: 'আলী',
          dueAmountSnapshot: '0.00',
          memoPageNumberSnapshot: '৫',
          sortOrder: 1,
        },
      ],
    };

    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');
    setAdminCsrfToken('test-csrf-token');
    server.use(
      http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
      ...halkhataMswHandlers(),
    );
    server.use(
      http.get('*/api/admin/halkhatas/:id/invitations/generations/:generationId/', () =>
        HttpResponse.json(twoRecipientGeneration),
      ),
    );

    const { container } = render(
      <LanguageProvider
        catalogs={{
          en: { ...adminTranslationsEn, ...halkhataTranslationsEn },
          bn: { ...adminTranslationsBn, ...halkhataTranslationsBn },
        }}
      >
        <AdminAuthProvider>
          <InvitationPrintPage />
        </AdminAuthProvider>
      </LanguageProvider>,
    );

    await screen.findAllByText('হালখাতার দাওয়াতনামা');
    expect(container.querySelectorAll('.invitation-page')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /2 per page/i }));
    expect(container.querySelectorAll('.invitation-page--half')).toHaveLength(2);
  });

  it('calls window.print from toolbar action', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPrintPage();
    await screen.findByText('হালখাতার দাওয়াতনামা');
    await userEvent.click(screen.getByRole('button', { name: /Print \/ Save as PDF/i }));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
