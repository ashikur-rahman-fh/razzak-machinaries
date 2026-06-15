# Geo API

Bangladesh administrative hierarchy reference data: **Division → District → Upazila → Union**.

Used for location selects in the marketplace and future listing addresses. Data is seeded from the standard `bd_geo_code` export; sync is **manual** (not on container startup).

## Data sync

After migrations, load reference data once:

```bash
make backend-sync-geo
```

Production (when needed):

```bash
make prod-sync-geo
```

Optional flags (passed through to Django):

```bash
make backend-sync-geo -- --clear   # wipe geo tables then reload (dev/troubleshooting)
```

Source files live in [`apps/backend/geo/data/`](../apps/backend/geo/data/) (PHPMyAdmin JSON export format):

- `divisions.json`, `districts.json`, `upazilas.json`, `unions.json`, `villages.json`

`make backend-sync-geo` loads all five when `villages.json` is present. Override the village file with `--villages-file /path/to/export.json`.

## Bilingual fields

All geo items expose English and Bangla names:

| JSON API | Database |
|----------|----------|
| `nameEn` | `name_en` |
| `nameBn` | `name_bn` |

The `url`, `lat`, and `lon` fields from the source export are **not** stored or returned.

## Error envelope

Non-2xx responses use the standard API envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input and try again.",
    "details": { "divisionId": "This query parameter is required." }
  }
}
```

## Public read API (Phase 1)

No authentication. Throttled via the `api` scope (see [`environment-variables.md`](environment-variables.md) for `DRF_THROTTLE_API`).

Responses are cached in Redis for **24 hours** per resource/filter combination.

### List divisions

```http
GET /api/public/geo/divisions/
```

**Response `200`:** JSON array of division objects.

```json
[
  { "id": 6, "nameEn": "Dhaka", "nameBn": "ঢাকা" }
]
```

Empty database → `[]`.

**Example:**

```bash
curl -s http://localhost:8080/api/public/geo/divisions/
```

---

### List districts in a division

```http
GET /api/public/geo/districts/?divisionId={id}
```

| Query param | Required | Type | Description |
|-------------|----------|------|-------------|
| `divisionId` | yes | positive integer | Parent division ID |

**Response `200`:** JSON array of district objects (same shape as divisions).

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Missing, invalid, or unknown `divisionId` |

**Example:**

```bash
curl -s 'http://localhost:8080/api/public/geo/districts/?divisionId=6'
```

---

### List upazilas in a district

```http
GET /api/public/geo/upazilas/?districtId={id}
```

| Query param | Required | Type | Description |
|-------------|----------|------|-------------|
| `districtId` | yes | positive integer | Parent district ID |

**Response `200`:** JSON array of upazila objects.

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Missing, invalid, or unknown `districtId` |

**Example:**

```bash
curl -s 'http://localhost:8080/api/public/geo/upazilas/?districtId=47'
```

---

### List unions in an upazila

```http
GET /api/public/geo/unions/?upazilaId={id}
```

| Query param | Required | Type | Description |
|-------------|----------|------|-------------|
| `upazilaId` | yes | positive integer | Parent upazila ID |

**Response `200`:** JSON array of union objects.

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Missing, invalid, or unknown `upazilaId` |

**Example:**

```bash
curl -s 'http://localhost:8080/api/public/geo/unions/?upazilaId=1'
```

---

### List villages (paginated)

Standalone village reference data (not linked to unions in v1). Responses are **paginated** because village datasets can be large.

```http
GET /api/public/geo/villages/
```

| Query param | Required | Type | Description |
|-------------|----------|------|-------------|
| `page` | no | positive integer | Page number (default `1`) |
| `pageSize` | no | positive integer | Items per page (default `50`, max `200`) |
| `search` | no | string | Search `nameEn` / `nameBn` (case-insensitive) |
| `ordering` | no | string | `nameEn`, `-nameEn`, `nameBn`, `-nameBn`, `id`, `-id` |

**Response `200`:** Paginated object with `count`, `next`, `previous`, `results` (each village: `{ id, nameEn, nameBn }`).

**Example:**

```bash
curl -s 'http://localhost:8080/api/public/geo/villages/?search=Balaram&pageSize=20'
```

---

## TypeScript client

From `@razzak-machinaries/shared/api`:

```ts
import {
  getDivisions,
  getDistricts,
  getUpazilas,
  getUnions,
  getVillages,
} from '@razzak-machinaries/shared/api';

const divisions = await getDivisions();
const districts = await getDistricts(6);
const upazilas = await getUpazilas(47);
const unions = await getUnions(1);
const villages = await getVillages({ search: 'Balaram', page: 1, pageSize: 20 });
```

Types: `GeoDivision`, `GeoDistrict`, `GeoUpazila`, `GeoUnion`, `GeoVillage` (each `{ id, nameEn, nameBn }` where applicable).

Route constants: `API_ROUTES.publicGeo` in `@razzak-machinaries/shared/constants/routes`.

## Data model

| Model | Rows (seeded) | Parent FK |
|-------|---------------|-----------|
| Division | 8 | — |
| District | 64 | `division_id` |
| Upazila | 494 | `district_id` |
| Union | 4540 | `upazila_id` |
| Village | varies | — (standalone list in v1) |

Source integer IDs are preserved as primary keys for stable references.

### Village import (admin)

```http
POST /api/admin/geo/villages/import/?dryRun=true
Content-Type: multipart/form-data
```

| Field | Required | Description |
|-------|----------|-------------|
| `file` | yes | PHPMyAdmin JSON export (`type: table`, `name: villages`) or plain JSON array of `{ id, name, bn_name }` |

| Query param | Description |
|-------------|-------------|
| `dryRun=true` | Validate and return preview stats without writing to the database |

**Response `200`:** `{ total, valid, invalid, wouldCreate, wouldUpdate, errors: [{ rowIndex, message }] }`

Omit `dryRun` or set `dryRun=false` to commit via `update_or_create`.

## Admin CRUD API

Superuser session auth only. Same policy as other admin routes: authenticated, active **superusers** only. CSRF required on `POST`, `PUT`, `PATCH`, and `DELETE`.

Base path: `/api/admin/geo/`

### Authentication

1. `GET /api/admin/auth/csrf/` — obtain CSRF token
2. `POST /api/admin/auth/login/` — establish session
3. Send `X-CSRFToken` header on all unsafe admin geo requests

### Endpoints (each resource)

Resources: `divisions`, `districts`, `upazilas`, `unions`, `villages`

| Method | Path | Success | Description |
|--------|------|---------|-------------|
| `GET` | `/api/admin/geo/{resource}/` | `200` | Paginated list |
| `POST` | `/api/admin/geo/{resource}/` | `201` | Create |
| `GET` | `/api/admin/geo/{resource}/{id}/` | `200` | Retrieve |
| `PATCH` | `/api/admin/geo/{resource}/{id}/` | `200` | Partial update |
| `PUT` | `/api/admin/geo/{resource}/{id}/` | `200` | Full update |
| `DELETE` | `/api/admin/geo/{resource}/{id}/` | `204` | Delete (empty body) |

Child resources include parent FK in responses: `divisionId`, `districtId`, `upazilaId`.

### List query parameters

| Param | Applies to | Default | Description |
|-------|------------|---------|-------------|
| `page` | all | `1` | Page number |
| `pageSize` | all | `50` | Page size (max `200`) |
| `search` | all | — | Case-insensitive match on `nameEn` or `nameBn` |
| `ordering` | all | `nameEn` | `nameEn`, `-nameEn`, `nameBn`, `-nameBn`, `id`, `-id` |
| `divisionId` | districts | — | Filter by division |
| `districtId` | upazilas | — | Filter by district |
| `upazilaId` | unions | — | Filter by upazila |

**Paginated response:**

```json
{
  "count": 64,
  "next": "/api/admin/geo/districts/?page=2&pageSize=50",
  "previous": null,
  "results": [
    { "id": 47, "divisionId": 6, "nameEn": "Dhaka", "nameBn": "ঢাকা" }
  ]
}
```

### Create / update bodies

**Division:**

```json
{ "nameEn": "Test", "nameBn": "টেস্ট" }
```

**District:**

```json
{ "divisionId": 6, "nameEn": "Dhaka", "nameBn": "ঢাকা" }
```

Optional `id` on POST. If omitted, the server assigns `max(existing id) + 1` for that table.

At least one of `nameEn` / `nameBn` is required. Parent FK is required on POST for child resources.

### Admin error codes

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No session |
| `ADMIN_FORBIDDEN` | 403 | Authenticated but not superuser |
| `VALIDATION_ERROR` | 400 | Invalid input or query params |
| `NOT_FOUND` | 404 | Unknown id |
| `GEO_HAS_CHILDREN` | 409 | DELETE blocked by child records |
| `GEO_ID_CONFLICT` | 409 | POST with id already in use |

**Example `GEO_HAS_CHILDREN`:**

```json
{
  "success": false,
  "error": {
    "code": "GEO_HAS_CHILDREN",
    "message": "This area cannot be deleted because it has child records.",
    "details": { "childType": "district" }
  }
}
```

### Cache invalidation

Any admin create/update/delete bumps the public geo cache version, so `/api/public/geo/*` reflects changes on the next request without waiting for the 24h TTL.

### TypeScript client

From `@razzak-machinaries/shared/api`:

```ts
import { adminGeoApi } from '@razzak-machinaries/shared/api';

const page = await adminGeoApi.listDistricts({ divisionId: 6, pageSize: 20 });
const created = await adminGeoApi.createDivision({ nameEn: 'Test', nameBn: 'টেস্ট' });
await adminGeoApi.updateDivision(created.id, { nameEn: 'Updated' });
await adminGeoApi.deleteDivision(created.id);
```

Types: `Paginated<T>`, `GeoListParams`, `GeoDivisionWrite`, `GeoDistrictWrite`, etc. Routes: `API_ROUTES.adminGeo`.

## Related docs

- [`architecture.md`](architecture.md) — system overview
- [`development.md`](development.md) — local setup and sync commands
- [`bilingual-system.md`](bilingual-system.md) — `nameEn` / `nameBn` conventions
