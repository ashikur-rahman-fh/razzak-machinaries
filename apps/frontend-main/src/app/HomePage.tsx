'use client';

import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  LanguageSwitcher,
  Navbar,
  PageShell,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const CATEGORIES = [
  { key: 'home.categoryTractors', href: '/products?category=tractors' },
  { key: 'home.categoryHarvesters', href: '/products?category=harvesters' },
  { key: 'home.categoryPlows', href: '/products?category=plows' },
  { key: 'home.categoryIrrigation', href: '/products?category=irrigation' },
  { key: 'home.categorySpareParts', href: '/products?category=spare-parts' },
  { key: 'home.categoryImplements', href: '/products?category=implements' },
] as const;

const FEATURED_LISTINGS = [
  {
    nameKey: 'home.listing1Name',
    categoryKey: 'home.listing1Category',
    locationKey: 'home.listing1Location',
    priceKey: 'home.listing1Price',
    href: '/products/1',
  },
  {
    nameKey: 'home.listing2Name',
    categoryKey: 'home.listing2Category',
    locationKey: 'home.listing2Location',
    priceKey: 'home.listing2Price',
    href: '/products/2',
  },
  {
    nameKey: 'home.listing3Name',
    categoryKey: 'home.listing3Category',
    locationKey: 'home.listing3Location',
    priceKey: 'home.listing3Price',
    href: '/products/3',
  },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { language, displayMode, setPreference } = useLanguagePreference();

  return (
    <PageShell
      header={
        <Navbar
          appName={<TranslatedText translationKey="home.appName" as="span" layout="inline" />}
          navigationLabel={`${t('home.appName')} ${t('nav.navigation')}`}
          openMenuLabel={t('nav.openMenu')}
          closeMenuLabel={t('common.close')}
          menuDescription={t('nav.openMenu')}
          items={[
            {
              label: <TranslatedText translationKey="nav.home" as="span" layout="inline" />,
              href: '/',
              active: true,
            },
            {
              label: <TranslatedText translationKey="nav.products" as="span" layout="inline" />,
              href: '/products',
            },
            {
              label: <TranslatedText translationKey="nav.services" as="span" layout="inline" />,
              href: '/services',
            },
          ]}
          actions={
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
          }
        />
      }
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8">
        <section
          aria-labelledby="home-hero-title"
          className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-8"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h1
                id="home-hero-title"
                className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                <TranslatedText translationKey="home.heroTitle" as="span" />
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                <TranslatedText translationKey="home.heroSubtitle" as="span" />
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <SearchIcon />
                <Input
                  type="search"
                  placeholder={t('home.searchPlaceholder')}
                  aria-label={t('home.searchPlaceholder')}
                  className="w-full pl-9"
                  data-testid="home-search-input"
                />
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <a href="/products">
                    <TranslatedText translationKey="home.browseListings" as="span" compact />
                  </a>
                </Button>
                <Button
                  asChild
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                >
                  <a href="/sell">
                    <TranslatedText translationKey="home.sellMachine" as="span" compact />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="home-categories-title">
          <h2
            id="home-categories-title"
            className="mb-4 font-display text-lg font-semibold text-foreground"
          >
            <TranslatedText translationKey="home.categoriesTitle" as="span" />
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((category) => (
              <a
                key={category.key}
                href={category.href}
                className="flex min-h-16 items-center justify-center rounded-md border border-border bg-card px-2 py-3 text-center text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              >
                <TranslatedText translationKey={category.key} as="span" layout="inline" />
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-featured-title">
          <div className="mb-4 space-y-1">
            <h2
              id="home-featured-title"
              className="font-display text-lg font-semibold text-foreground"
            >
              <TranslatedText translationKey="home.featuredTitle" as="span" />
            </h2>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="home.featuredSubtitle" as="span" />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_LISTINGS.map((listing) => (
              <Card key={listing.href} className="shadow-card">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      <TranslatedText translationKey={listing.nameKey} as="span" />
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      <TranslatedText translationKey={listing.categoryKey} as="span" compact />
                    </Badge>
                  </div>
                  <CardDescription>
                    <TranslatedText translationKey={listing.locationKey} as="span" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 pt-0">
                  <p className="text-sm font-semibold text-foreground">
                    <TranslatedText translationKey={listing.priceKey} as="span" />
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={listing.href}>
                      <TranslatedText translationKey="common.viewDetails" as="span" compact />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Alert
          variant="info"
          title={<TranslatedText translationKey="home.trustTitle" as="span" />}
          description={
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
              <li>
                <TranslatedText translationKey="home.trustVerified" as="span" />
              </li>
              <li>
                <TranslatedText translationKey="home.trustServiceAreas" as="span" />
              </li>
              <li>
                <TranslatedText translationKey="home.trustSupport" as="span" />
              </li>
            </ul>
          }
        />
      </div>
    </PageShell>
  );
}
