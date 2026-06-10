import { LanguageProvider } from '@razzak-machinaries/shared/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HomePage } from './src/app/HomePage';
import { mainTranslationsBn, mainTranslationsEn } from './src/i18n/translations';

function renderHomePage() {
  return render(
    <LanguageProvider catalogs={{ en: mainTranslationsEn, bn: mainTranslationsBn }}>
      <HomePage />
    </LanguageProvider>,
  );
}

describe('HomePage', () => {
  it('renders marketplace hero and search', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      mainTranslationsEn['home.heroTitle'],
    );
    expect(screen.getByTestId('home-search-input')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: mainTranslationsEn['home.browseListings'] })).toHaveAttribute(
      'href',
      '/products',
    );
    expect(screen.getByRole('link', { name: mainTranslationsEn['home.sellMachine'] })).toHaveAttribute(
      'href',
      '/sell',
    );
  });

  it('renders category links', () => {
    renderHomePage();
    expect(screen.getByRole('link', { name: mainTranslationsEn['home.categoryTractors'] })).toHaveAttribute(
      'href',
      '/products?category=tractors',
    );
    expect(screen.getByRole('link', { name: mainTranslationsEn['home.categoryHarvesters'] })).toBeInTheDocument();
  });

  it('renders featured listings section', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { level: 2, name: mainTranslationsEn['home.featuredTitle'] })).toBeInTheDocument();
    expect(screen.getByText(mainTranslationsEn['home.listing1Name'])).toBeInTheDocument();
    expect(screen.getByText(mainTranslationsEn['home.listing2Name'])).toBeInTheDocument();
    expect(screen.getByText(mainTranslationsEn['home.listing3Name'])).toBeInTheDocument();
  });

  it('renders trust strip', () => {
    renderHomePage();
    expect(screen.getByText(mainTranslationsEn['home.trustTitle'])).toBeInTheDocument();
    expect(screen.getByText(mainTranslationsEn['home.trustVerified'])).toBeInTheDocument();
  });

  it('shows both languages on sell CTA when display mode is both', async () => {
    const user = userEvent.setup();
    localStorage.setItem('rm_display_mode', 'both');
    localStorage.setItem('rm_language', 'en');

    renderHomePage();

    await user.click(screen.getByRole('button', { name: 'Both' }));

    expect(await screen.findByText(mainTranslationsEn['home.sellMachine'])).toHaveAttribute('lang', 'en');
    expect(screen.getByText(mainTranslationsBn['home.sellMachine'])).toHaveAttribute('lang', 'bn');
  });
});
