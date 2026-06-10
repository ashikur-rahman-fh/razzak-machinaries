/** AgriSteel Marketplace — default theme id for the Razzak Machinaries design system. */
export const defaultThemeId = 'agri-steel' as const;

export const defaultThemeName = 'AgriSteel Marketplace' as const;

export const defaultThemeConfig = {
  attribute: 'class' as const,
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
};

export type ThemeConfig = typeof defaultThemeConfig;
