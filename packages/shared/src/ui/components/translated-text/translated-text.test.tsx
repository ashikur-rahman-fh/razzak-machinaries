import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { writeLanguagePreferenceToStorage } from '../../../i18n/language-preference';
import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { TranslatedText } from './translated-text';

describe('TranslatedText', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders English only when display mode is en', async () => {
    writeLanguagePreferenceToStorage({ language: 'en', displayMode: 'en' });

    render(
      <LanguageProvider>
        <TranslatedText translationKey="common.save" />
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Save')).toHaveAttribute('lang', 'en');
    });
    expect(screen.queryByText('সংরক্ষণ')).not.toBeInTheDocument();
  });

  it('renders both languages when display mode is both', async () => {
    writeLanguagePreferenceToStorage({ language: 'en', displayMode: 'both' });

    render(
      <LanguageProvider>
        <TranslatedText translationKey="common.continue" as="span" compact />
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Continue')).toHaveAttribute('lang', 'en');
    });
    expect(screen.getByText('চালিয়ে যান')).toHaveAttribute('lang', 'bn');
  });
});
