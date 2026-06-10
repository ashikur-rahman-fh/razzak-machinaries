import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { fontFamilyDisplay, fontFamilySans } from './fonts';
import { defaultThemeId, defaultThemeName } from './theme-config';
import { semanticColorTokens, typographyTokens } from './tokens';

const themeCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../styles/theme.css'),
  'utf8',
);

describe('AgriSteel theme tokens', () => {
  it('exports a stable theme id and display name', () => {
    expect(defaultThemeId).toBe('agri-steel');
    expect(defaultThemeName).toBe('AgriSteel Marketplace');
  });

  it('defines semantic color variables in theme.css', () => {
    for (const token of semanticColorTokens) {
      expect(themeCss).toContain(`--${token}:`);
    }
  });

  it('uses field-green primary accent in light mode', () => {
    expect(themeCss).toMatch(/--primary:\s*132 36% 23%/);
    expect(themeCss).toMatch(/--background:\s*40 22% 98%/);
  });

  it('uses sunlit light-mode surface tokens', () => {
    expect(themeCss).toMatch(/--secondary:\s*40 20% 94%/);
    expect(themeCss).toMatch(/--secondary-foreground:\s*215 28% 22%/);
    expect(themeCss).not.toMatch(/--secondary-foreground:\s*132 30% 14%/);
    expect(themeCss).toMatch(/--muted:\s*40 18% 95%/);
    expect(themeCss).toMatch(/--border:\s*38 16% 86%/);
  });

  it('uses lighter green primary accent in dark mode', () => {
    expect(themeCss).toMatch(/\.dark[\s\S]*--primary:\s*118 32% 72%/);
  });

  it('defines typography CSS variables with Inter before Noto Sans', () => {
    expect(themeCss).toContain('--font-sans:');
    expect(themeCss).toContain('--font-display:');
    expect(themeCss).toContain('Inter');
    expect(themeCss).toContain('Noto Sans');
    expect(themeCss).toContain('Plus Jakarta Sans');
    expect(themeCss.indexOf('Inter')).toBeLessThan(themeCss.indexOf('Noto Sans'));
    expect(themeCss).toContain('--font-mono:');
    expect(themeCss).toContain('JetBrains Mono');
    expect(typographyTokens.sans).toBe('--font-sans');
    expect(typographyTokens.display).toBe('--font-display');
    expect(typographyTokens.mono).toBe('--font-mono');
    expect(fontFamilySans.indexOf('Inter')).toBeLessThan(fontFamilySans.indexOf('Noto Sans'));
    expect(fontFamilyDisplay).toContain('Plus Jakarta Sans');
  });

  it('exports semantic color token list for tooling', () => {
    expect(semanticColorTokens).toContain('primary');
    expect(semanticColorTokens).toContain('card');
  });

  it('defines marketplace radius scale in theme.css', () => {
    expect(themeCss).toContain('--radius-xs: 0.25rem');
    expect(themeCss).toContain('--radius-sm: 0.375rem');
    expect(themeCss).toContain('--radius-md: 0.5rem');
    expect(themeCss).toContain('--radius-lg: 0.75rem');
    expect(themeCss).toContain('--radius-xl: 1rem');
    expect(themeCss).toContain('--radius: 0.625rem');
  });
});
