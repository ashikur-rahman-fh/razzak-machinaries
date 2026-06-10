'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

import { defaultThemeConfig } from './theme-config';

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  // next-themes injects an inline script to prevent theme flash. React 19 warns when
  // script tags render in client components; application/json avoids the false positive.
  const resolvedScriptProps =
    typeof window === 'undefined'
      ? scriptProps
      : { type: 'application/json' as const, ...scriptProps };

  return (
    <NextThemesProvider
      {...defaultThemeConfig}
      {...props}
      scriptProps={resolvedScriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
