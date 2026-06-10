import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { defaultThemeId, defaultThemeName } from './theme-config';
import { semanticColorTokens, typographyTokens } from './tokens';

const themeCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../styles/theme.css'),
  'utf8',
);

describe('Calm Neutral theme tokens', () => {
  it('exports a stable theme id and display name', () => {
    expect(defaultThemeId).toBe('calm-neutral');
    expect(defaultThemeName).toBe('Calm Neutral');
  });

  it('defines semantic color variables in theme.css', () => {
    for (const token of semanticColorTokens) {
      expect(themeCss).toContain(`--${token}:`);
    }
  });

  it('uses field-green primary accent in light mode', () => {
    expect(themeCss).toMatch(/--primary:\s*132 32% 27%/);
    expect(themeCss).toMatch(/--background:\s*42 32% 96%/);
  });

  it('uses lighter green primary accent in dark mode', () => {
    expect(themeCss).toMatch(/\.dark[\s\S]*--primary:\s*118 28% 68%/);
  });

  it('defines typography CSS variables', () => {
    expect(themeCss).toContain('--font-sans:');
    expect(themeCss).toContain('Inter');
    expect(themeCss).toContain('--font-mono:');
    expect(themeCss).toContain('JetBrains Mono');
    expect(typographyTokens.sans).toBe('--font-sans');
    expect(typographyTokens.mono).toBe('--font-mono');
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
