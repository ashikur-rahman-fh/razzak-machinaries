import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  type LanguagePreference,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomerCreatePage } from './src/app/customers/new/CustomerCreatePage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { customerTranslationsBn, customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const pushMock = vi.fn();
const replaceMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
    refresh: vi.fn(),
  }),
  usePathname: () => '/customers/new',
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
}));

function setLanguagePreference(preference: LanguagePreference) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
}

function renderWithAuth(ui: ReactElement) {
  setLanguagePreference({ language: 'en', displayMode: 'en' });
  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...geoTranslationsEn, ...customerTranslationsEn },
        bn: { ...adminTranslationsBn, ...geoTranslationsBn, ...customerTranslationsBn },
      }}
    >
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

function setupAuthenticatedCustomerHandlers() {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    http.post('*/api/admin/translations/', async ({ request }) => {
      const body = (await request.json()) as { text: string };
      return HttpResponse.json({
        translatedText: `Translated: ${body.text}`,
        provider: 'azure',
      });
    }),
    http.post('*/api/admin/customers/', async () =>
      HttpResponse.json(
        {
          id: 1,
          fullNameBn: 'রহিম',
          fullNameEn: 'Rahim',
          addressBn: 'ঠিকানা',
          addressEn: 'Address',
          phoneBn: '০১৭১২৩৪৫৬৭৮',
          phoneEn: '01712345678',
          phone: '+8801712345678',
          fatherNameBn: 'করিম',
          fatherNameEn: 'Karim',
          memoPageNumberBn: '১২৩',
          memoPageNumberEn: '123',
          mediatorNameBn: '',
          mediatorNameEn: '',
          profilePictureUrl: null,
          createdAt: '2026-06-24T00:00:00Z',
          updatedAt: '2026-06-24T00:00:00Z',
        },
        { status: 201 },
      ),
    ),
  );
}

describe('CustomerCreatePage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    mockSearchParams = new URLSearchParams();
    setupAuthenticatedCustomerHandlers();
  });

  it('renders customer create form sections', async () => {
    renderWithAuth(<CustomerCreatePage />);
    expect(await screen.findByTestId('customer-create-page')).toBeInTheDocument();
    expect(screen.getByTestId('customer-create-form')).toBeInTheDocument();
    expect(screen.getByTestId('Phone number-bn-input')).toBeInTheDocument();
    expect(screen.getByTestId('Memo page number-bn-input')).toBeInTheDocument();
  });

  it('auto-translates English fields from Bangla input', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomerCreatePage />);
    await screen.findByTestId('customer-create-form');

    const fullNameBn = screen.getByTestId('Full name-bn-input');
    await user.type(fullNameBn, 'হ্যালো');

    await waitFor(() => {
      expect(screen.getByTestId('translation-status-auto')).toBeInTheDocument();
    });
  });

  it('auto-converts Latin phone and memo from Bangla input', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomerCreatePage />);
    await screen.findByTestId('customer-create-form');

    await user.type(screen.getByTestId('Phone number-bn-input'), '০১৭১২৩৪৫৬৭৮');
    await user.type(screen.getByTestId('Memo page number-bn-input'), '১২৩');

    await waitFor(() => {
      expect(screen.getByTestId('Phone number-en-input')).toHaveValue('01712345678');
      expect(screen.getByTestId('Memo page number-en-input')).toHaveValue('123');
      expect(screen.getAllByTestId('transliteration-status-auto')).toHaveLength(2);
    });
  });

  it('submits customer with Bangla phone and memo values', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CustomerCreatePage />);
    await screen.findByTestId('customer-create-form');

    await user.type(screen.getByTestId('Full name-bn-input'), 'রহিম');
    await user.type(screen.getByTestId('Full name-en-input'), 'Rahim');
    await user.type(screen.getByTestId('Address-bn-input'), 'ঠিকানা');
    await user.type(screen.getByTestId('Address-en-input'), 'Address');
    await user.type(screen.getByTestId('Phone number-bn-input'), '০১৭১২৩৪৫৬৭৮');
    await user.type(screen.getByTestId("Father's name-bn-input"), 'করিম');
    await user.type(screen.getByTestId("Father's name-en-input"), 'Karim');
    await user.type(screen.getByTestId('Memo page number-bn-input'), '১২৩');

    await user.click(screen.getByTestId('customer-create-submit'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/customers/new?success=created');
    });
  });
});
