/** Calm Neutral — default theme id for the Razzak Machinaries design system. */
export const defaultThemeId = 'calm-neutral' as const;

export const defaultThemeName = 'Calm Neutral' as const;

export const defaultThemeConfig = {
  attribute: 'class' as const,
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
};

export type ThemeConfig = typeof defaultThemeConfig;
