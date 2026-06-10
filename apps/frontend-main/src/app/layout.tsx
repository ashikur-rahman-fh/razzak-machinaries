import type { Metadata } from 'next';
import {
  getThemeHtmlClass,
  getThemeProviderModeConfig,
  parseThemeMode,
  ThemeProvider,
} from '@razzak-machinaries/shared/ui';
import '@razzak-machinaries/shared/ui/styles/globals.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Razzak Machinaries',
  description: 'Razzak Machinaries — farming machinery marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeMode = parseThemeMode(process.env.NEXT_PUBLIC_THEME_MODE);
  const themeProviderModeConfig = getThemeProviderModeConfig(themeMode);

  return (
    <html lang="en" suppressHydrationWarning className={getThemeHtmlClass(themeMode)}>
      <body>
        <ThemeProvider {...themeProviderModeConfig}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
