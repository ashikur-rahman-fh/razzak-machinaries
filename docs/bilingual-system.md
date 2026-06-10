# Bilingual System

Razzak Machinaries supports **English**, **Bangla**, and **dual-language display** for static UI and dynamic content. This is an in-app bilingual system (not URL-based locales or SEO routing).

## Supported modes

| Setting | Purpose |
|---------|---------|
| `language: en \| bn` | Primary locale for accessibility strings and `document.documentElement.lang` |
| `displayMode: en \| bn \| both` | How **visible** UI and content render (single language or stacked both) |

Defaults: `language = en`, `displayMode = en`.

When `displayMode === 'both'`, visible UI (buttons, nav, headings, badges, field labels) shows **stacked English + Bangla**. Accessibility-only strings (aria-labels, show/hide toggles, loading status) stay in the primary `language` via `t()`.

## Core types

Located in [`packages/shared/src/i18n/types.ts`](../packages/shared/src/i18n/types.ts):

- `Language` — `en` | `bn`
- `DisplayMode` — `en` | `bn` | `both`
- `BilingualTextValue` — `{ en?, bn? }`
- `LanguagePreference` — `{ language, displayMode }`

## Localization utilities

[`packages/shared/src/i18n/localization-utils.ts`](../packages/shared/src/i18n/localization-utils.ts)

| Function | Use |
|----------|-----|
| `getLocalizedText(value, language, fallback?)` | Single string with safe fallback |
| `getBilingualDisplay(value, displayMode, options?)` | Primary/secondary parts for UI |
| `getLocalizedField(record, baseFieldName, language)` | Reads `titleEn`/`titleBn` or `title_en`/`title_bn` |
| `isBanglaText(value)` | Detect Bengali script |
| `normalizeLanguagePreference(value)` | Parse localStorage safely |

### Fallback rules

- **English mode:** en → bn → fallback → `""`
- **Bangla mode:** bn → en → fallback → `""`
- **Both mode:** show both when different; show one if only one exists; never duplicate equal text

## Static translations

Shared keys live in:

- [`packages/shared/src/i18n/translations/translations.en.ts`](../packages/shared/src/i18n/translations/translations.en.ts)
- [`packages/shared/src/i18n/translations/translations.bn.ts`](../packages/shared/src/i18n/translations/translations.bn.ts)

App-specific keys:

- [`apps/frontend-main/src/i18n/translations.ts`](../apps/frontend-main/src/i18n/translations.ts)
- [`apps/frontend-admin/src/i18n/translations.ts`](../apps/frontend-admin/src/i18n/translations.ts)

### Adding a translation key

1. Add the key to the shared or app `translations.en.ts`
2. Add the Bangla string to the matching `translations.bn.ts`
3. For **visible** UI: `<TranslatedText translationKey="your.key" />`
4. For **accessibility-only** strings: `const { t } = useTranslation()` and `t('your.key')`

Fallback order: selected language → English → key string.

### TranslatedText vs t()

| API | Use for |
|-----|---------|
| `<TranslatedText translationKey="common.save" compact />` | Buttons, badges — centered stacked layout |
| `<TranslatedText translationKey="nav.home" layout="inline" />` | Nav links, brand — centered stacked layout |
| `<TranslatedText translationKey="home.title" />` | Headings, descriptions, visible field labels — default left-aligned layout |
| `t('nav.openMenu')` | aria-labels, show/hide toggles, loading status, switcher meta labels |

Use `compact` inside buttons and badges. Use `layout="inline"` for nav labels and brand text. Omit both for headings and body copy (default layout).

### Both-mode layout

When `displayMode === 'both'`, global CSS under `[data-content-display='both']` relaxes fixed heights on shared UI buttons (`[data-slot='button']`, including `Button asChild` links) and badges so stacked bilingual text is not clipped. `CardTitle` uses comfortable line height. Pair this with the correct `TranslatedText` layout variant per context.

### TranslatedText layout prop

| `layout` | Use |
|----------|-----|
| `default` | Headings, descriptions, general copy |
| `compact` | Buttons, badges (also via `compact={true}`) |
| `inline` | Navbar links and brand — centered stacked layout |

```tsx
<TranslatedText translationKey="common.continue" as="span" compact />
<TranslatedText translationKey="nav.home" as="span" layout="inline" />
```

Reads `displayMode` from context and renders via `BilingualText`. Use for static translation keys.

### BilingualText

```tsx
<BilingualText
  en={item.titleEn}
  bn={item.titleBn}
  mode={displayMode}
  language={language}
  layout="default"
/>
```

Optional `layout`: `default` | `compact` | `inline`. When secondary text exists, the root gets flex column stacking with context-appropriate alignment and line height.

Uses `lang="en"` / `lang="bn"` and Bangla typography classes.

## Per-app coverage

| App | Bilingual scope | Language switcher |
|-----|-----------------|-------------------|
| **frontend-main** | All UI (`HomePage`) | Navbar |
| **frontend-admin** | Profile, change password, authenticated navbar | `AdminNavbar` after sign-in |
| **frontend-admin auth** | **English only** — login page, session guards, login error messages | Not shown on `/login` |

### Admin authentication (English only)

Sign-in and auth-gate flows intentionally stay **English-only** for clarity and consistency with credential entry:

- [`apps/frontend-admin/src/app/login/LoginPage.tsx`](../apps/frontend-admin/src/app/login/LoginPage.tsx) — uses [`ADMIN_AUTH_COPY`](../apps/frontend-admin/src/auth/messages.ts), no `TranslatedText` or `LanguageSwitcher`
- [`AdminAuthProvider`](../apps/frontend-admin/src/auth/AdminAuthProvider.tsx) — login/unauthorized errors from `ADMIN_AUTH_COPY`
- [`guards.tsx`](../apps/frontend-admin/src/auth/guards.tsx) — loading/redirect labels from `ADMIN_AUTH_COPY`

After sign-in, the user's stored preference applies to profile and change-password pages via [`AdminNavbar`](../apps/frontend-admin/src/components/AdminNavbar.tsx).

### Admin translation keys

Post-login strings live in [`apps/frontend-admin/src/i18n/translations.ts`](../apps/frontend-admin/src/i18n/translations.ts):

| Prefix | Use |
|--------|-----|
| `admin.*` | App name in navbar |
| `nav.profile` | Profile nav link |
| `profile.*` | Profile page copy, form labels, status badges, logout |
| `password.*` | Change-password page copy and validation messages |

Use `layout="inline"` for nav labels, `compact` for buttons/badges in admin pages (same as main app).

## Language preference

- **Storage:** `localStorage` (`rm_language`, `rm_display_mode`)
- **Provider:** [`LanguageProvider`](../packages/shared/src/i18n/LanguageProvider.tsx) in each app's `AppProviders.tsx`
- **Hook:** `useLanguagePreference()` — read/update language and display mode
- **Document lang:** updated client-side via `document.documentElement.lang`
- **Display mode attribute:** `document.documentElement.dataset.contentDisplay` (`en` | `bn` | `both`) — set by `applyDocumentDisplayMode()` when preference loads or changes. Enables scoped CSS for both-mode layout (`[data-slot='button']` and badges grow vertically, etc.).

## UI components

### LanguageSwitcher

```tsx
<LanguageSwitcher
  language={language}
  displayMode={displayMode}
  onSelectEnglish={() => setPreference({ language: 'en', displayMode: 'en' })}
  onSelectBangla={() => setPreference({ language: 'bn', displayMode: 'bn' })}
  onSelectBoth={() => setPreference({ displayMode: 'both' })}
  labels={{ english: t('language.english'), ... }}
/>
```

### TranslatedText

```tsx
<TranslatedText translationKey="common.continue" as="span" compact />
<TranslatedText translationKey="nav.home" as="span" layout="inline" />
```

See [TranslatedText layout prop](#translatedtext-layout-prop) above for `compact`, `inline`, and `default` usage.

### BilingualText

```tsx
<BilingualText
  en={item.titleEn}
  bn={item.titleBn}
  mode={displayMode}
  language={language}
  layout="default"
/>
```

See [BilingualText](#bilingualtext) above for layout variants.

## Dynamic API fields

| Layer | Naming |
|-------|--------|
| PostgreSQL | `title_en`, `title_bn` |
| JSON API | `titleEn`, `titleBn` |

The API always returns **both** fields. The frontend resolves display with shared utilities.

**Geo reference data** (divisions, districts, upazilas, unions) follows the same camelCase API pattern (`nameEn`, `nameBn`). See [`api-geo.md`](api-geo.md).

Reference: [`apps/backend/api/app_metadata.py`](../apps/backend/api/app_metadata.py)

Backend helpers:

- [`api/serializers/bilingual.py`](../apps/backend/api/serializers/bilingual.py)
- [`api/admin/bilingual.py`](../apps/backend/api/admin/bilingual.py)
- [`api/db/bilingual_search.py`](../apps/backend/api/db/bilingual_search.py)
- [`api/models/mixins.py`](../apps/backend/api/models/mixins.py)

## Adding bilingual model fields

1. Add `title_en` / `title_bn` (nullable Bangla initially)
2. Migrate existing data: copy `title` → `title_en`
3. Register with `BilingualModelAdmin.bilingual_fieldsets(['title'])`
4. Expose camelCase fields in DRF serializers
5. Use `bilingual_icontains(queryset, query, 'title')` for search

## Typography

Bangla uses `--font-bangla` (Noto Sans Bengali). Utility classes:

- `.lang-en` — Latin stack
- `.lang-bn` — Bengali stack, line-height 1.75
- `.bilingual-secondary` — subdued secondary line in both-mode

Do not uppercase Bangla text.

## Accessibility

- Correct `lang` attributes on rendered text
- Language switcher is keyboard operable with `aria-pressed`
- Visible field labels on profile and change-password pages use `TranslatedText` (respect `displayMode`)
- Aria-only labels (show/hide password, menu toggles) use `t()` (primary language only)

## Error messages

API errors use stable `error.code` values. Frontend maps codes to localized strings via [`error-messages.ts`](../packages/shared/src/i18n/error-messages.ts):

```ts
getUserFacingMessage(error, language)
```

Unknown or unmapped `error.code` values fall back to localized safe defaults—not raw backend messages.

## Future improvements

- `BilingualInput` form pair component
- Profile-stored language preference
- Cookie sync if first-paint flash becomes an issue
- Translation key parity CI check
