'use client';

import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  BrandLogo,
  LanguageSwitcher,
  Navbar,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';

export type AdminNavbarProps = {
  activeRoute: 'profile' | 'change-password' | 'bangladesh-address' | 'customers' | 'transactions';
  onLogout?: () => void;
  isLoggingOut?: boolean;
};

export function AdminNavbar({ activeRoute, onLogout, isLoggingOut = false }: AdminNavbarProps) {
  const { t } = useTranslation();
  const { language, displayMode, setPreference } = useLanguagePreference();

  const items = [
    {
      label: <TranslatedText translationKey="nav.profile" as="span" layout="inline" />,
      href: '/',
      active: activeRoute === 'profile',
    },
    {
      label: <TranslatedText translationKey="nav.bangladeshAddress" as="span" layout="inline" />,
      href: '/bangladesh-address',
      active: activeRoute === 'bangladesh-address',
    },
    {
      label: <TranslatedText translationKey="nav.customers" as="span" layout="inline" />,
      href: '/customers',
      active: activeRoute === 'customers',
    },
    {
      label: <TranslatedText translationKey="nav.transactions" as="span" layout="inline" />,
      href: '/transactions',
      active: activeRoute === 'transactions',
    },
    ...(activeRoute === 'change-password'
      ? [
          {
            label: (
              <TranslatedText translationKey="password.changePassword" as="span" layout="inline" />
            ),
            href: '/change-password',
            active: true,
          },
        ]
      : []),
  ];

  return (
    <Navbar
      logo={<BrandLogo size="navbar" />}
      appName={
        <>
          <span className="lg:hidden">
            <TranslatedText translationKey="admin.appNameShort" as="span" layout="inline" />
          </span>
          <span className="hidden lg:inline">
            <TranslatedText translationKey="admin.appName" as="span" layout="inline" />
          </span>
        </>
      }
      navigationLabel={`${t('admin.appName')} ${t('nav.navigation')}`}
      openMenuLabel={t('nav.openMenu')}
      closeMenuLabel={t('common.close')}
      menuDescription={t('nav.menuDescription')}
      items={items}
      actions={
        <div className="flex items-center gap-2">
          <LanguageSwitcher
            language={language}
            displayMode={displayMode}
            onSelectEnglish={() => setPreference({ language: 'en', displayMode: 'en' })}
            onSelectBangla={() => setPreference({ language: 'bn', displayMode: 'bn' })}
            onSelectBoth={() => setPreference({ displayMode: 'both' })}
            labels={{
              english: t('language.english'),
              bangla: t('language.bangla'),
              both: t('language.both'),
              selectLanguage: t('language.selectLanguage'),
            }}
          />
          {onLogout ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <TranslatedText translationKey="profile.loggingOut" as="span" compact />
              ) : (
                <TranslatedText translationKey="profile.logout" as="span" compact />
              )}
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
