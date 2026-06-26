'use client';

import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  BrandLogo,
  Button,
  LanguageSwitcher,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  TranslatedText,
  cn,
} from '@razzak-machinaries/shared/ui';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export type AdminActiveRoute =
  | 'dashboard'
  | 'customers'
  | 'transactions'
  | 'bangladesh-address'
  | 'profile'
  | 'change-password';

export type AdminSidebarProps = {
  activeRoute: AdminActiveRoute;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  onNavigate?: () => void;
  className?: string;
};

type NavItem = {
  key: AdminActiveRoute;
  href: string;
  translationKey: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/', translationKey: 'nav.dashboard' },
  { key: 'customers', href: '/customers', translationKey: 'nav.customers' },
  { key: 'transactions', href: '/transactions', translationKey: 'nav.transactions' },
  {
    key: 'bangladesh-address',
    href: '/bangladesh-address',
    translationKey: 'nav.bangladeshAddress',
  },
  { key: 'profile', href: '/profile', translationKey: 'nav.profile' },
];

function isNavActive(item: NavItem, activeRoute: AdminActiveRoute): boolean {
  if (item.key === activeRoute) return true;
  if (activeRoute === 'change-password' && item.key === 'profile') return true;
  return false;
}

function SidebarBrandLink({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label={t('nav.dashboard')}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md px-1 py-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <BrandLogo size="navbar" />
      <span className="min-w-0 truncate font-display text-sm font-medium leading-snug text-left text-foreground">
        <TranslatedText translationKey="admin.appNameShort" as="span" layout="default" />
      </span>
    </Link>
  );
}

function SidebarNav({
  activeRoute,
  onNavigate,
}: {
  activeRoute: AdminActiveRoute;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin navigation">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item, activeRoute);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full min-h-10 items-center justify-start rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <TranslatedText translationKey={item.translationKey} as="span" layout="default" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter({
  onLogout,
  isLoggingOut,
}: {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}) {
  const { t } = useTranslation();
  const { language, displayMode, setPreference } = useLanguagePreference();

  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
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
          className="w-full"
        >
          {isLoggingOut ? (
            <TranslatedText translationKey="profile.loggingOut" as="span" compact />
          ) : (
            <TranslatedText translationKey="profile.logout" as="span" compact />
          )}
        </Button>
      ) : null}
    </div>
  );
}

export function AdminSidebar({
  activeRoute,
  onLogout,
  isLoggingOut = false,
  onNavigate,
  className,
}: AdminSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'flex h-full w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6',
        className,
      )}
    >
      <SidebarBrandLink onNavigate={onNavigate} className="mb-6" />

      <SidebarNav activeRoute={activeRoute} onNavigate={onNavigate} />
      <SidebarFooter onLogout={onLogout} isLoggingOut={isLoggingOut} />
      <span className="sr-only">{`${t('admin.appName')} ${t('nav.navigation')}`}</span>
    </aside>
  );
}

export function AdminMobileNav({ activeRoute, onLogout, isLoggingOut = false }: AdminSidebarProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden print:hidden">
      <SidebarBrandLink />
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label={t('nav.openMenu')}
          >
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>
              <TranslatedText translationKey="admin.appName" as="span" layout="default" />
            </SheetTitle>
            <SheetDescription>{t('nav.menuDescription')}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col px-4 py-4">
            <SidebarNav activeRoute={activeRoute} onNavigate={() => setMenuOpen(false)} />
            <SidebarFooter onLogout={onLogout} isLoggingOut={isLoggingOut} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AdminSidebarLayout({
  activeRoute,
  onLogout,
  isLoggingOut,
  children,
  contentClassName,
  ...props
}: AdminSidebarProps & {
  children: ReactNode;
  contentClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();

  return (
    <div className={cn('flex min-h-screen bg-background', props.className)} {...props}>
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 print:hidden">
        <AdminSidebar activeRoute={activeRoute} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64 print:pl-0">
        <AdminMobileNav activeRoute={activeRoute} onLogout={onLogout} isLoggingOut={isLoggingOut} />
        <main
          key={pathname}
          className={cn(
            'mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8',
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
