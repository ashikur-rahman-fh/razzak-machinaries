import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BilingualText } from './bilingual-text';

describe('BilingualText', () => {
  it('renders English only in en mode', () => {
    render(<BilingualText en="Custom Printing" bn="কাস্টম প্রিন্টিং" mode="en" />);
    expect(screen.getByText('Custom Printing')).toHaveAttribute('lang', 'en');
    expect(screen.queryByText('কাস্টম প্রিন্টিং')).not.toBeInTheDocument();
  });

  it('renders both languages in both mode', () => {
    render(<BilingualText en="Custom Printing" bn="কাস্টম প্রিন্টিং" mode="both" />);
    expect(screen.getByText('Custom Printing')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('কাস্টম প্রিন্টিং')).toHaveAttribute('lang', 'bn');
  });

  it('falls back when one translation is missing', () => {
    render(<BilingualText en="Only English" bn="" mode="bn" />);
    expect(screen.getByText('Only English')).toBeInTheDocument();
  });

  it('applies compact layout classes when secondary text is present', () => {
    const { container } = render(
      <BilingualText en="Custom Printing" bn="কাস্টম প্রিন্টিং" mode="both" layout="compact" />,
    );

    const root = container.querySelector('.bilingual-text');
    expect(root).toHaveClass('inline-flex', 'flex-col', 'items-center', 'text-center');
    expect(screen.getByText('Custom Printing')).toHaveClass('text-sm', 'leading-snug');
    expect(screen.getByText('কাস্টম প্রিন্টিং')).toHaveClass('text-[0.75rem]', 'leading-snug');
  });

  it('applies inline layout classes for nav-style stacking', () => {
    const { container } = render(<BilingualText en="Home" bn="হোম" mode="both" layout="inline" />);

    const root = container.querySelector('.bilingual-text');
    expect(root).toHaveClass(
      'inline-flex',
      'flex-col',
      'items-center',
      'text-center',
      'leading-snug',
    );
  });
});

describe('LanguageSwitcher', () => {
  it('calls handlers and exposes aria-pressed state', async () => {
    const user = userEvent.setup();
    const onSelectBangla = vi.fn();

    const { LanguageSwitcher } = await import('../language-switcher/language-switcher');

    render(
      <LanguageSwitcher
        language="en"
        displayMode="en"
        onSelectEnglish={() => undefined}
        onSelectBangla={onSelectBangla}
        onSelectBoth={() => undefined}
        labels={{
          english: 'English',
          bangla: 'বাংলা',
          both: 'Both',
          selectLanguage: 'Select language',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(onSelectBangla).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('button', { name: 'বাংলা' })).toHaveAttribute('lang', 'bn');
  });

  it('marks both mode as active with aria-pressed', async () => {
    const { LanguageSwitcher } = await import('../language-switcher/language-switcher');

    render(
      <LanguageSwitcher
        language="en"
        displayMode="both"
        onSelectEnglish={() => undefined}
        onSelectBangla={() => undefined}
        onSelectBoth={() => undefined}
        labels={{
          english: 'English',
          bangla: 'বাংলা',
          both: 'Both',
          selectLanguage: 'Select language',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
