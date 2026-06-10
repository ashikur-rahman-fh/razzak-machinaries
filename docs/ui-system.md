# Shared UI system

The design system lives in **`packages/shared/src/ui/`** and is consumed as **`@razzak-machinaries/shared/ui`**.

## Default theme: AgriSteel Marketplace

**Theme id:** `agri-steel`

A **warm, trustworthy, practical** look for a farming machinery marketplace — sunlit page backgrounds, white cards, deep field-green primary, harvest-orange accent for key CTAs, and **high-readability contrast** for body and muted text.

### Visual direction

- Warm, agricultural, professional — built for listings, filters, and dashboards
- Field-green primary, light linen secondary surfaces, harvest-orange accent for CTAs
- Light: `40 22% 98%` sunlit page background, **white cards**, foreground `215 32% 10%`
- Secondary chips/toolbars: `40 20% 94%` fill with slate text `215 28% 22%` (not dark forest green)
- Dark: green-tinted "steel dashboard" surfaces (`140 14% 8%`)
- Primary: **field green** (`132 36% 23%` light, `118 32% 72%` dark)
- Muted text: `215 12% 40%` light, `42 18% 76%` dark
- Soft borders (`38 16% 86%` light) and green focus rings
- **Sturdy** corner radius (not bubbly); airy warm-neutral card shadows

### Fonts

| Use | Stack |
| --- | ----- |
| UI (default) | Inter, Noto Sans, ui-sans-serif, system-ui, … |
| Headings / nav brand | Plus Jakarta Sans, Inter, Noto Sans, … (`font-display`) |
| Code / metadata | JetBrains Mono, SFMono-Regular, Consolas, monospace |

Inter is the primary UI font for sharp, eye-soothing body copy; Noto Sans provides multilingual fallback. **Noto Sans Bengali** (`--font-bangla`, `.lang-bn`) is used for Bangla script. Plus Jakarta Sans is used for headings, card titles, and navbar brand via the `font-display` utility. Fonts load from Google Fonts in `globals.css`. Use `font-mono` or `<code>` only for technical copy (API paths, env labels, version strings).

For bilingual content, use `BilingualText` from `@razzak-machinaries/shared/ui` and see [`bilingual-system.md`](bilingual-system.md).

### Theme tokens

All colors and radius live in **[`packages/shared/src/ui/styles/theme.css`](../../packages/shared/src/ui/styles/theme.css)** as HSL channels:

`background`, `foreground`, `card`, `card-foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `destructive`, `destructive-foreground`, `warning`, `warning-foreground`, `success`, `success-foreground`, `info`, `info-foreground`

TypeScript: `defaultThemeId`, `defaultThemeName`, `semanticColorTokens`, `radiusTokens`, `componentRadiusGuide` in `theme/`.

### Radius scale

Centralized in `theme.css` — mapped to Tailwind `rounded-*` utilities:

| Token | Value | Tailwind | Typical use |
| ----- | ----- | -------- | ----------- |
| `--radius-xs` | 0.25rem | `rounded-xs` | Tiny controls, close buttons |
| `--radius-sm` | 0.375rem | `rounded-sm` | Compact chips |
| `--radius-md` | 0.5rem | `rounded-md` | **Buttons, inputs, badges** (default) |
| `--radius-lg` | 0.75rem | `rounded-lg` | **Cards, alerts, panels, toasts** |
| `--radius-xl` | 1rem | `rounded-xl` | Large dialogs (sparingly) |
| `--radius` | 0.625rem | default | Between `md` and `lg` |

**Guidelines:**

- Do **not** use `rounded-2xl` or `rounded-full` for default buttons/cards.
- Navbar (full-width): no radius on the bar itself.
- Prefer `rounded-md` for interactive controls, `rounded-lg` for surfaces.
- Change the scale in `theme.css` only — components use Tailwind classes, not hardcoded rem values.

**Rebrand checklist:**

1. Edit HSL values in `theme.css` (`:root` and `.dark`) — start with `--primary` and `--background`.
2. Adjust `--radius-*` and `--shadow-*` if needed.
3. Optionally update `--font-sans`, `--font-display`, or Google Fonts in `globals.css`.
4. Never hardcode colors or excessive rounding in components — use semantic tokens and `rounded-md` / `rounded-lg`.

### Light / dark mode

`ThemeProvider` applies the `dark` class on `<html>`. Both frontends share the same CSS so main and admin stay aligned.

## Stack

| Layer | Role |
| ----- | ---- |
| **Tailwind CSS v4** | Utilities |
| **shadcn/ui** | Primitives in `primitives/shadcn/` |
| **Basecoat CSS** | Optional foundation utilities |
| **Custom components** | Public API in `components/` |

## Importing

```tsx
import { Button, Alert, Card, Navbar, PageShell, ThemeProvider } from '@razzak-machinaries/shared/ui';
import '@razzak-machinaries/shared/ui/styles/globals.css';
```

## Components

| Component | Style notes |
| --------- | ----------- |
| **Button** | `rounded-md`; field-green primary; semantic variants |
| **Alert** | `rounded-lg`; light tinted backgrounds |
| **Card** | `rounded-lg`; white, warm border, `shadow-card` |
| **Navbar** | Full-width, no bar radius; links `rounded-md` |
| **Input** | `rounded-md`; green focus ring |
| **PasswordInput** | Password field with inline Eye / EyeOff toggle; `aria-label` for show/hide (no visible text on the button) |
| **Badge** | `rounded-md` (not pill-shaped) |

Pass `className` for app-level tweaks.

## Developer rules

1. Import reusable UI from `@razzak-machinaries/shared/ui`.
2. Do not duplicate or hardcode brand colors in apps.
3. Customize via `theme.css` tokens only when rebranding.
4. Add tests and update this doc when changing the system.

## Preview & tests

```bash
npx pnpm@9.15.0 --filter @razzak-machinaries/frontend-main dev
npx pnpm@9.15.0 --filter @razzak-machinaries/shared test
```
