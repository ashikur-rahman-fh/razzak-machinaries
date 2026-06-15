import { setAdminCsrfToken } from '@razzak-machinaries/shared/api';
import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  type LanguagePreference,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BangladeshAddressPage } from './src/app/bangladesh-address/BangladeshAddressPage';
import { BangladeshAddressDetailPage } from './src/app/bangladesh-address/[geoType]/[id]/BangladeshAddressDetailPage';
import { BangladeshAddressEditPage } from './src/app/bangladesh-address/[geoType]/[id]/edit/BangladeshAddressEditPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { geoTranslationsBn, geoTranslationsEn } from './src/i18n/geo-translations';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import {
  geoDivision,
  geoDistrict,
  geoVillage,
  paginated,
} from './src/bangladesh-address/geo-fixtures';
import { geoMswHandlers } from './src/bangladesh-address/geo-msw-handlers';
import { adminUser, server } from './vitest.setup';

const pushMock = vi.fn();
const replaceMock = vi.fn();
let mockSearchParams = new URLSearchParams('type=divisions');
let mockParams: Record<string, string> = { geoType: 'divisions', id: '6' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
  usePathname: () => `/bangladesh-address/${mockParams.geoType}/${mockParams.id}`,
  useSearchParams: () => mockSearchParams,
  useParams: () => mockParams,
}));

function setLanguagePreference(preference: LanguagePreference) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
}

function renderWithAuth(
  ui: ReactElement,
  preference: LanguagePreference = { language: 'en', displayMode: 'en' },
) {
  setLanguagePreference(preference);
  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...geoTranslationsEn },
        bn: { ...adminTranslationsBn, ...geoTranslationsBn },
      }}
    >
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

function setupAuthenticatedGeo() {
  setAdminCsrfToken('test-csrf-token');
  server.use(
    http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
    http.get('*/api/admin/auth/csrf/', () => HttpResponse.json({ csrfToken: 'test-csrf-token' })),
    ...geoMswHandlers,
  );
}

describe('BangladeshAddressPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    mockSearchParams = new URLSearchParams('type=divisions');
    setupAuthenticatedGeo();
  });

  it('renders hub with stats and table', async () => {
    renderWithAuth(<BangladeshAddressPage />);

    expect(await screen.findByTestId('bangladesh-address-page')).toBeInTheDocument();
    expect(await screen.findByTestId('geo-stats-cards')).toBeInTheDocument();
    expect(await screen.findByTestId('geo-stat-divisions')).toHaveTextContent('8');
    expect(await screen.findByTestId('geo-address-table')).toBeInTheDocument();
    expect(screen.getByText(geoDivision.nameEn)).toBeInTheDocument();
    expect(screen.queryByText(/url/i)).not.toBeInTheDocument();
  });

  it('renders pagination controls', async () => {
    renderWithAuth(<BangladeshAddressPage />);
    await screen.findByTestId('geo-address-table');
    expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: geoTranslationsEn['geo.pagination.previous'] }),
    ).toBeDisabled();
  });

  it('switches type tab and updates route', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressPage />);
    await screen.findByTestId('geo-type-tabs');

    await user.click(screen.getByRole('tab', { name: geoTranslationsEn['geo.type.districts'] }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('type=districts'));
    });
  });

  it('renders empty search state', async () => {
    mockSearchParams = new URLSearchParams('type=divisions&search=zzznomatch');
    renderWithAuth(<BangladeshAddressPage />);

    expect(await screen.findByText(geoTranslationsEn['geo.list.emptySearch'])).toBeInTheDocument();
  });

  it('renders villages tab with bilingual row and import panel', async () => {
    mockSearchParams = new URLSearchParams('type=villages');
    renderWithAuth(<BangladeshAddressPage />);

    expect(await screen.findByTestId('village-import-panel')).toBeInTheDocument();
    expect(await screen.findByTestId('geo-address-table')).toBeInTheDocument();
    expect(screen.getByText(geoVillage.nameEn)).toBeInTheDocument();
    expect(screen.getByText(geoVillage.nameBn)).toBeInTheDocument();
  });

  it('previews village import from JSON file', async () => {
    mockSearchParams = new URLSearchParams('type=villages');
    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressPage />);
    await screen.findByTestId('village-import-panel');

    const file = new File(
      [JSON.stringify([{ id: '1', name: 'Balarampur', bn_name: 'বলরামপুর' }])],
      'villages.json',
      { type: 'application/json' },
    );
    const input = screen.getByTestId('village-import-file-input');
    await user.upload(input, file);
    await user.click(screen.getByTestId('village-import-preview-button'));

    expect(await screen.findByTestId('village-import-preview')).toBeInTheDocument();
    expect(await screen.findByTestId('village-import-preview')).toBeInTheDocument();
    expect(screen.getByTestId('village-import-commit-button')).toBeInTheDocument();
  });

  it('keeps pagination and table rows mounted during search refetch', async () => {
    let releaseSearchRequest: (() => void) | undefined;
    const searchRequestGate = new Promise<void>((resolve) => {
      releaseSearchRequest = resolve;
    });

    server.use(
      http.get('*/api/admin/geo/divisions/', async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search') ?? '';
        if (search === 'Dha') {
          await searchRequestGate;
        }
        const results =
          search && !geoDivision.nameEn.toLowerCase().includes(search.toLowerCase())
            ? []
            : [geoDivision];
        return HttpResponse.json(paginated(results, 8));
      }),
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithAuth(<BangladeshAddressPage />);
    await screen.findByTestId('geo-address-table');
    expect(screen.getByText(geoDivision.nameEn)).toBeInTheDocument();
    expect(screen.getByText(/Showing 1/)).toBeInTheDocument();

    await user.type(screen.getByTestId('geo-search-input'), 'Dha');
    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText(geoDivision.nameEn)).toBeInTheDocument();
      expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
      expect(screen.getByTestId('geo-address-table')).toHaveAttribute('aria-busy', 'true');
    });

    releaseSearchRequest?.();
    await waitFor(() => {
      expect(screen.getByTestId('geo-address-table')).toHaveAttribute('aria-busy', 'false');
    });

    vi.useRealTimers();
  });

  it('does not show stale division rows when switching to districts tab', async () => {
    let releaseDistrictsRequest: (() => void) | undefined;
    const districtsRequestGate = new Promise<void>((resolve) => {
      releaseDistrictsRequest = resolve;
    });

    server.use(
      http.get('*/api/admin/geo/districts/', async () => {
        await districtsRequestGate;
        return HttpResponse.json(paginated([geoDistrict], 64));
      }),
    );

    const page = <BangladeshAddressPage />;
    const user = userEvent.setup();
    const view = renderWithAuth(page);
    await screen.findByText(geoDivision.nameEn);

    pushMock.mockImplementation((url: string) => {
      const query = url.includes('?') ? url.split('?')[1] : '';
      mockSearchParams = new URLSearchParams(query);
    });

    await user.click(screen.getByRole('tab', { name: geoTranslationsEn['geo.type.districts'] }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled();
    });

    view.rerender(
      <LanguageProvider
        catalogs={{
          en: { ...adminTranslationsEn, ...geoTranslationsEn },
          bn: { ...adminTranslationsBn, ...geoTranslationsBn },
        }}
      >
        <AdminAuthProvider>{page}</AdminAuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(
        within(screen.getByTestId('geo-address-table')).queryByText(geoDivision.nameEn),
      ).not.toBeInTheDocument();
    });

    releaseDistrictsRequest?.();
    expect(await screen.findByText(geoDistrict.nameEn)).toBeInTheDocument();
  });

  it('links place name to detail page with list state preserved', async () => {
    mockSearchParams = new URLSearchParams('type=divisions&page=2');
    renderWithAuth(<BangladeshAddressPage />);
    await screen.findByTestId('geo-address-table');

    const link = screen.getByRole('link', {
      name: geoTranslationsEn['geo.actions.viewPlace']
        .replace('{name}', geoDivision.nameEn)
        .replace('{type}', geoTranslationsEn['geo.type.division']),
    });

    expect(link).toHaveAttribute(
      'href',
      '/bangladesh-address/divisions/6?from=type%3Ddivisions%26page%3D2',
    );
  });

  it('shows both languages on stats, tabs, and table headers when display mode is both', async () => {
    renderWithAuth(<BangladeshAddressPage />, { language: 'en', displayMode: 'both' });

    expect(await screen.findByTestId('geo-stats-cards')).toBeInTheDocument();
    expect(screen.getByText(geoTranslationsEn['geo.stats.divisions'])).toHaveAttribute(
      'lang',
      'en',
    );
    expect(screen.getByText(geoTranslationsBn['geo.stats.divisions'])).toHaveAttribute(
      'lang',
      'bn',
    );

    const tabs = screen.getByTestId('geo-type-tabs');
    expect(within(tabs).getByText(geoTranslationsEn['geo.type.divisions'])).toHaveAttribute(
      'lang',
      'en',
    );
    expect(within(tabs).getByText(geoTranslationsBn['geo.type.divisions'])).toHaveAttribute(
      'lang',
      'bn',
    );

    await screen.findByTestId('geo-address-table');
    expect(screen.getByText(geoTranslationsEn['geo.field.sourceId'])).toHaveAttribute('lang', 'en');
    expect(screen.getByText(geoTranslationsBn['geo.field.sourceId'])).toHaveAttribute('lang', 'bn');
  });
});

describe('BangladeshAddressDetailPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockParams = { geoType: 'divisions', id: '6' };
    mockSearchParams = new URLSearchParams('');
    setupAuthenticatedGeo();
  });

  it('renders division detail without url field', async () => {
    renderWithAuth(<BangladeshAddressDetailPage />);

    expect(await screen.findByTestId('geo-detail-page')).toBeInTheDocument();
    expect(screen.getByTestId('geo-detail-header')).toBeInTheDocument();
    expect(screen.getByTestId('geo-name-editor')).toBeInTheDocument();
    expect(screen.getByTestId('geo-readonly-details')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: geoDivision.nameEn })).toBeInTheDocument();
    expect(screen.getByText(String(geoDivision.id))).toBeInTheDocument();
    expect(screen.getByLabelText(geoTranslationsEn['geo.field.name'])).toHaveValue(
      geoDivision.nameEn,
    );
    expect(screen.queryByText(/^url$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^latitude$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^longitude$/i)).not.toBeInTheDocument();
  });

  it('disables save when name is unchanged', async () => {
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-name-editor');

    expect(
      screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }),
    ).toBeDisabled();
  });

  it('disables save when name is empty', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-name-editor');

    const nameInput = screen.getByLabelText(geoTranslationsEn['geo.field.name']);
    await user.clear(nameInput);

    expect(
      screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }),
    ).toBeDisabled();
  });

  it('opens confirm modal on save and patches only changed name fields', async () => {
    const patchedBodies: Array<Record<string, string>> = [];
    server.use(
      http.patch('*/api/admin/geo/divisions/:id/', async ({ request }) => {
        const body = (await request.json()) as Record<string, string>;
        patchedBodies.push(body);
        return HttpResponse.json({ ...geoDivision, ...body });
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-name-editor');

    const nameInput = screen.getByLabelText(geoTranslationsEn['geo.field.name']);
    await user.clear(nameInput);
    await user.type(nameInput, 'Dhaka City');
    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: geoTranslationsEn['geo.update.nameTitle'] }),
    ).toBeInTheDocument();
    expect(patchedBodies).toHaveLength(0);

    await user.click(
      within(dialog).getByRole('button', { name: geoTranslationsEn['geo.update.confirm'] }),
    );

    await waitFor(() => {
      expect(patchedBodies).toHaveLength(1);
      expect(patchedBodies[0]).toEqual({ nameEn: 'Dhaka City' });
    });

    const nameEditor = screen.getByTestId('geo-name-editor');
    expect(
      await within(nameEditor).findByText(geoTranslationsEn['geo.update.nameSuccess']),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('geo-detail-success')).not.toBeInTheDocument();
  });

  it('shows redirect success banner when arriving with success=updated query param', async () => {
    mockSearchParams = new URLSearchParams('success=updated');
    renderWithAuth(<BangladeshAddressDetailPage />);

    expect(await screen.findByTestId('geo-detail-success')).toBeInTheDocument();
    expect(screen.getByText(geoTranslationsEn['geo.update.success'])).toBeInTheDocument();
    expect(screen.queryByTestId('geo-name-editor-success')).not.toBeInTheDocument();
  });

  it('does not patch when confirm update is cancelled on detail page', async () => {
    let patchCount = 0;
    server.use(
      http.patch('*/api/admin/geo/divisions/:id/', () => {
        patchCount += 1;
        return HttpResponse.json(geoDivision);
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-name-editor');

    const nameInput = screen.getByLabelText(geoTranslationsEn['geo.field.name']);
    await user.clear(nameInput);
    await user.type(nameInput, 'Dhaka City');
    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }));

    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: geoTranslationsEn['geo.actions.cancel'] }),
    );

    expect(patchCount).toBe(0);
    expect(nameInput).toHaveValue('Dhaka City');
  });

  it('shows not found state for missing record', async () => {
    mockParams = { geoType: 'divisions', id: '999' };
    renderWithAuth(<BangladeshAddressDetailPage />);

    expect(await screen.findByText(geoTranslationsEn['geo.detail.notFound'])).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: geoTranslationsEn['geo.actions.backToBangladeshAddressList'],
      }),
    ).toBeInTheDocument();
  });

  it('opens delete confirmation modal', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-detail-page');

    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.delete'] }));
    expect(await screen.findByText(geoTranslationsEn['geo.delete.title'])).toBeInTheDocument();
  });

  it('shows delete constraint error for division with children', async () => {
    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressDetailPage />);
    await screen.findByTestId('geo-detail-page');

    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.delete'] }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: geoTranslationsEn['geo.delete.confirm'] }),
    );

    expect(
      await within(dialog).findByText(/cannot be deleted because it has districts/i),
    ).toBeInTheDocument();
  });
});

describe('BangladeshAddressEditPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockParams = { geoType: 'divisions', id: '6' };
    mockSearchParams = new URLSearchParams('');
    setupAuthenticatedGeo();
  });

  it('loads existing data into edit form', async () => {
    renderWithAuth(<BangladeshAddressEditPage />);

    const form = await screen.findByTestId('geo-edit-form');
    expect(form).toBeInTheDocument();
    expect(screen.getByLabelText(geoTranslationsEn['geo.field.name'])).toHaveValue(
      geoDivision.nameEn,
    );
    expect(screen.getByLabelText(geoTranslationsEn['geo.field.nameBn'])).toHaveValue(
      geoDivision.nameBn,
    );
  });

  it('opens confirm modal on save and patches on confirm', async () => {
    const patchedBodies: Array<Record<string, string>> = [];
    server.use(
      http.patch('*/api/admin/geo/divisions/:id/', async ({ request }) => {
        const body = (await request.json()) as Record<string, string>;
        patchedBodies.push(body);
        return HttpResponse.json({ ...geoDivision, ...body });
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressEditPage />);
    await screen.findByTestId('geo-edit-form');

    const nameInput = screen.getByLabelText(geoTranslationsEn['geo.field.name']);
    await user.clear(nameInput);
    await user.type(nameInput, 'Dhaka City');
    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: geoTranslationsEn['geo.update.title'] }),
    ).toBeInTheDocument();
    expect(patchedBodies).toHaveLength(0);

    await user.click(
      within(dialog).getByRole('button', { name: geoTranslationsEn['geo.update.confirm'] }),
    );

    await waitFor(() => {
      expect(patchedBodies).toHaveLength(1);
      expect(patchedBodies[0]).toEqual({
        nameEn: 'Dhaka City',
        nameBn: geoDivision.nameBn,
      });
    });
  });

  it('does not patch when confirm update is cancelled', async () => {
    let patchCount = 0;
    server.use(
      http.patch('*/api/admin/geo/divisions/:id/', () => {
        patchCount += 1;
        return HttpResponse.json(geoDivision);
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<BangladeshAddressEditPage />);
    await screen.findByTestId('geo-edit-form');

    await user.click(screen.getByRole('button', { name: geoTranslationsEn['geo.actions.save'] }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: geoTranslationsEn['geo.actions.cancel'] }),
    );

    expect(patchCount).toBe(0);
  });
});

describe('BangladeshAddress district detail', () => {
  beforeEach(() => {
    mockParams = { geoType: 'districts', id: '61' };
    mockSearchParams = new URLSearchParams('');
    setupAuthenticatedGeo();
  });

  it('renders district detail with parent fields', async () => {
    renderWithAuth(<BangladeshAddressDetailPage />);
    expect(await screen.findByTestId('geo-readonly-details')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: geoDistrict.nameEn })).toBeInTheDocument();
    expect(screen.getByText(String(geoDistrict.divisionId))).toBeInTheDocument();
  });

  it('shows not available when parent lookup is missing', async () => {
    server.use(http.get('*/api/admin/geo/divisions/', () => HttpResponse.json(paginated([], 0))));

    renderWithAuth(<BangladeshAddressDetailPage />);
    expect(await screen.findByTestId('geo-readonly-details')).toBeInTheDocument();
    expect(screen.getByText(geoTranslationsEn['geo.value.notAvailable'])).toBeInTheDocument();
    expect(screen.getByText(String(geoDistrict.divisionId))).toBeInTheDocument();
  });
});
