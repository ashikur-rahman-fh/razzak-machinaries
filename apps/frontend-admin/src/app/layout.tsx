import type { Metadata } from 'next';
import {
  getThemeHtmlClass,
  getThemeProviderModeConfig,
  parseThemeMode,
  ThemeProvider,
} from '@razzak-machinaries/shared/ui';
import '@razzak-machinaries/shared/ui/styles/globals.css';
import { AdminAuthProvider } from '@/auth/AdminAuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Razzak Machinaries Admin',
  description: 'Razzak Machinaries admin sign-in and profile',
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
        <ThemeProvider {...themeProviderModeConfig}>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
