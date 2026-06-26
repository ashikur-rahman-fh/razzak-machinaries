import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
} from '@razzak-machinaries/shared/i18n';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { customerTranslationsEn } from '@/i18n/customer-translations';

import { FieldChangeList } from './FieldChangeList';
import { normalizeDiffValue } from './FieldDiffViewer';

function renderFieldChangeList(props: ComponentProps<typeof FieldChangeList>) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, 'both');

  return render(
    <LanguageProvider catalogs={{ en: customerTranslationsEn, bn: {} }}>
      <FieldChangeList {...props} />
    </LanguageProvider>,
  );
}

describe('normalizeDiffValue', () => {
  it('converts semicolon-separated values to line breaks', () => {
    expect(normalizeDiffValue('A × 1 @ 100; B × 2 @ 50')).toBe('A × 1 @ 100\nB × 2 @ 50');
  });

  it('returns single-line values unchanged', () => {
    expect(normalizeDiffValue('Rahim Uddin')).toBe('Rahim Uddin');
  });
});

describe('FieldChangeList', () => {
  it('renders empty message when there are no changes', () => {
    renderFieldChangeList({
      changes: [],
      emptyMessageKey: 'customer.history.noChanges',
    });

    expect(screen.getByText('No field changes from the previous version.')).toBeInTheDocument();
  });

  it('renders field label and diff viewer for each change', async () => {
    renderFieldChangeList({
      changes: [
        {
          labelKey: 'customer.field.fullName',
          from: 'Rahim Uddin',
          to: 'Rahim Updated',
        },
      ],
      viewMode: 'unified',
    });

    expect(screen.getByText('Full name')).toBeInTheDocument();
    expect(screen.getByTestId('field-diff-viewer')).toHaveAttribute('data-view-mode', 'unified');
    expect(await screen.findByText('Uddin')).toBeInTheDocument();
    expect(await screen.findByText('Updated')).toBeInTheDocument();
    expect(screen.getByTestId('field-change-item').textContent).toContain('Rahim');
  });

  it('passes split view mode and before/after titles', () => {
    renderFieldChangeList({
      changes: [
        {
          labelKey: 'customer.field.address',
          from: 'Old address',
          to: 'New address',
        },
      ],
      viewMode: 'split',
      beforeTitleKey: 'customer.history.diff.before',
      afterTitleKey: 'customer.history.diff.after',
    });

    expect(screen.getByTestId('field-diff-viewer')).toHaveAttribute('data-view-mode', 'split');
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});
