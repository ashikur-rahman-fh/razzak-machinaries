import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/customers',
  useSearchParams: () => new URLSearchParams(),
}));

import { CustomerTable } from './src/customers/components/CustomerTable';
import { sampleCustomer } from './src/customers/customer-fixtures';
import { EMPTY_CELL_VALUE } from './src/customers/utils';
import { customerTranslationsEn } from './src/i18n/customer-translations';
import { geoTranslationsEn } from './src/i18n/geo-translations';
import { adminTranslationsEn } from './src/i18n/translations';

const listState = { page: 1, pageSize: 25, search: '', ordering: '-created_at' as const };

function renderCustomerTable(customers = [sampleCustomer]) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'en');

  return render(
    <LanguageProvider
      catalogs={{
        en: { ...adminTranslationsEn, ...geoTranslationsEn, ...customerTranslationsEn },
        bn: {},
      }}
    >
      <CustomerTable
        customers={customers}
        listState={listState}
        pageSize={25}
        isLoading={false}
        error={null}
        hasSearch={false}
        onRetry={() => undefined}
        onClearSearch={() => undefined}
      />
    </LanguageProvider>,
  );
}

describe('CustomerTable', () => {
  it('renders refresh overlay outside the table element', () => {
    const { container } = render(
      <LanguageProvider
        catalogs={{
          en: { ...adminTranslationsEn, ...geoTranslationsEn, ...customerTranslationsEn },
          bn: {},
        }}
      >
        <CustomerTable
          customers={[sampleCustomer]}
          listState={listState}
          pageSize={25}
          isLoading={false}
          isRefreshing
          error={null}
          hasSearch={false}
          onRetry={() => undefined}
          onClearSearch={() => undefined}
        />
      </LanguageProvider>,
    );

    const table = container.querySelector('table');
    const root = screen.getByTestId('customer-table');
    const refreshBar = root.querySelector('.animate-pulse');

    expect(table).toBeInTheDocument();
    expect(refreshBar).toBeInTheDocument();
    expect(table?.contains(refreshBar)).toBe(false);
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('shows empty placeholders for optional fields', () => {
    const sparseCustomer = {
      ...sampleCustomer,
      id: 99,
      fatherNameBn: '',
      fatherNameEn: '',
      addressBn: '   ',
      addressEn: '',
      mediatorNameBn: '',
      mediatorNameEn: '',
      memoPageNumberBn: '',
      memoPageNumberEn: '',
    };

    renderCustomerTable([sparseCustomer]);

    const row = screen.getByTestId('customer-row-99');
    const placeholders = Array.from(row.querySelectorAll('td')).filter((cell) =>
      cell.textContent?.includes(EMPTY_CELL_VALUE),
    );
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });
});
