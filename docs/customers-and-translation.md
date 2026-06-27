# Customers and translation

This document describes the admin customer creation flow, backend translation service, profile picture handling, and local/production configuration.

## Overview

Admins create customers at **`/customers/new`** in the admin app with **Bangla-first** data entry:

1. Bangla fields are the primary inputs.
2. Name, address, and family fields auto-translate English via `POST /api/admin/translations/` (debounced on the client).
3. **Phone** and **memo page number** use local Bangla digit conversion (০–৯ → 0–9) on the client — no Azure calls. Memo page numbers are **digits only**.
4. Admins can manually edit English/Latin fields; manual edits are not overwritten until **Re-translate** (text) or **Re-convert** (phone/memo).
5. Customer creation succeeds even when translation fails (English can be entered manually).
6. Optional profile pictures can be uploaded or captured with the device camera.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/admin/translations/` | Translate text (`bn` ↔ `en`) |
| `GET` | `/api/admin/customers/` | List customers (paginated, searchable) |
| `POST` | `/api/admin/customers/` | Create customer (JSON or `multipart/form-data`) |
| `GET` | `/api/admin/customers/{id}/` | Customer detail |
| `PATCH` | `/api/admin/customers/{id}/` | Update customer |
| `DELETE` | `/api/admin/customers/{id}/` | Delete customer |

All admin endpoints require an active Django **staff or superuser** session. Unsafe methods (`POST`, `PATCH`, `PUT`, `DELETE`) also require a valid CSRF token; the shared admin client refreshes it via `ensureAdminCsrf()` before each write (including translation).

### Translation request

```json
POST /api/admin/translations/
{
  "text": "বাংলা লেখা",
  "source": "bn",
  "target": "en"
}
```

```json
{
  "translatedText": "English translation",
  "provider": "azure"
}
```

### Customer create (multipart)

Send camelCase field names as form fields plus optional `profilePicture` file:

- `fullNameBn`, `fullNameEn`, `addressBn`, `addressEn`
- `phoneBn`, `phoneEn` (Latin digits; `phone` normalized `+880…` returned read-only)
- `fatherNameBn`, `fatherNameEn`, `memoPageNumberBn`, `memoPageNumberEn` (digits only)
- `mediatorNameBn`, `mediatorNameEn` (optional)
- `profilePicture` (optional image file)

Phone numbers are normalized server-side to `+8801XXXXXXXXX`. Both Bangla and Latin phone/memo values are stored.

## Translation architecture

- **Provider abstraction:** `apps/backend/api/services/translation/`
- **Default provider:** Azure Translator (`providers/azure.py`)
- **Optional fallback:** LibreTranslate (`TRANSLATION_PROVIDER=libretranslate`)
- **Caching:** Redis, keyed by hash of source + target + text (TTL configurable)
- **Security:** Translation input text is never logged. Profile images are never sent to the translation service.

Switching providers: set `TRANSLATION_PROVIDER` or implement `TranslationProvider` and wire it in `get_translation_service()`.

## Azure Translator setup

Translation uses Azure Cognitive Services **Text Translation v3.0**. All calls go through the Django backend — the browser never receives Azure keys.

### 1. Get credentials from Azure Portal

Open your Text Translation resource (e.g. `razzak-machineries`) → **Keys and Endpoint**:

- **Endpoint** → `AZURE_TRANSLATOR_ENDPOINT`
- **Key** → `AZURE_TRANSLATOR_KEY` (secret — do not commit)
- **Location/Region** → `AZURE_TRANSLATOR_REGION` (when required)

### 2. Configure environment

Add to `infra/env/dev/.env` or `infra/env/prod/.env` (not `.env.example`):

```env
TRANSLATION_PROVIDER=azure
AZURE_TRANSLATOR_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com
AZURE_TRANSLATOR_REGION=your-azure-region
AZURE_TRANSLATOR_KEY=your-secret-key-from-portal
```

See [environment-variables.md](./environment-variables.md#translation-azure-translator) for optional tuning vars.

### 3. Local development

Docker Compose dev no longer includes LibreTranslate. Set Azure credentials in `infra/env/dev/.env`, then:

```bash
make dev-up
```

If Azure is unavailable or misconfigured, translation fails gracefully and admins can enter English manually.

## Profile pictures

- Stored under `media/customers/profiles/{YYYY}/{MM}/customer-{id}.{ext}`
- Accepted types: JPG, PNG, WebP
- Max size: 2 MiB (serializer validation)
- Served at `/media/...` (proxied by Nginx in dev)
- **Upload:** file picker with client-side compression (max 1200px edge, JPEG quality 0.85)
- **Capture:** browser `getUserMedia` camera flow with preview, retake, and fallback to upload if permission is denied

Images are stored as files via Django storage — not base64 in the database.

## Environment variables

See [environment-variables.md](./environment-variables.md#translation-azure-translator) for the full list.

## Related code

| Area | Location |
|------|----------|
| Customer model/API | `apps/backend/customers/` |
| Translation service | `apps/backend/api/services/translation/` |
| Shared API clients | `packages/shared/src/api/admin-customers.ts`, `admin-translations.ts` |
| Reusable UI | `packages/shared/src/ui/components/bilingual-translatable-field/`, `bilingual-transliteration-field/`, `profile-image-picker/` |
| Bangla digit utils | `packages/shared/src/i18n/bangla-script-utils.ts` |
| Admin create page | `apps/frontend-admin/src/app/customers/new/` |
