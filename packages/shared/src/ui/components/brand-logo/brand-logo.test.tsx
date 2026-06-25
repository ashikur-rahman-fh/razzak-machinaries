import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BRAND_LOGO_ALT, BRAND_LOGO_PATH, BrandLogo, getBrandLogoSrc } from './brand-logo';

describe('BrandLogo', () => {
  it('renders with default navbar size and alt text', () => {
    render(<BrandLogo />);
    const logo = screen.getByRole('img', { name: BRAND_LOGO_ALT });
    expect(logo).toHaveAttribute('src', BRAND_LOGO_PATH);
    expect(logo).toHaveClass('h-16', 'w-auto');
  });

  it('renders login size classes', () => {
    render(<BrandLogo size="login" />);
    const logo = screen.getByRole('img', { name: BRAND_LOGO_ALT });
    expect(logo).toHaveClass('h-32', 'w-auto');
  });

  it('applies custom className', () => {
    render(<BrandLogo className="mx-auto" />);
    expect(screen.getByRole('img', { name: BRAND_LOGO_ALT })).toHaveClass('mx-auto');
  });
});

describe('getBrandLogoSrc', () => {
  it('prefixes basePath when provided', () => {
    expect(getBrandLogoSrc('/admin')).toBe('/admin/brand/rms-logo-main.jpg');
  });

  it('returns default path when basePath is empty', () => {
    expect(getBrandLogoSrc('')).toBe(BRAND_LOGO_PATH);
  });
});
