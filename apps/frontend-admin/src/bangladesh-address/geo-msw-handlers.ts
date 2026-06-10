import { http, HttpResponse } from 'msw';

import { geoDistrict, geoDivision, geoUnion, geoUpazila, paginated } from './geo-fixtures';

export const geoMswHandlers = [
  http.get('*/api/admin/geo/divisions/', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const results =
      search && !geoDivision.nameEn.toLowerCase().includes(search.toLowerCase())
        ? []
        : [geoDivision];
    return HttpResponse.json(paginated(results, 8));
  }),
  http.get('*/api/admin/geo/divisions/:id/', ({ params }) => {
    if (Number(params.id) === geoDivision.id) {
      return HttpResponse.json(geoDivision);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.patch('*/api/admin/geo/divisions/:id/', async ({ params, request }) => {
    const body = (await request.json()) as { nameEn?: string; nameBn?: string };
    return HttpResponse.json({ ...geoDivision, ...body, id: Number(params.id) });
  }),
  http.delete('*/api/admin/geo/divisions/:id/', ({ params }) => {
    if (Number(params.id) === geoDivision.id) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'GEO_HAS_CHILDREN',
            message: 'Cannot delete',
            details: { childType: 'district' },
          },
        },
        { status: 409 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/api/admin/geo/districts/', () => HttpResponse.json(paginated([geoDistrict], 64))),
  http.get('*/api/admin/geo/districts/:id/', ({ params }) => {
    if (Number(params.id) === geoDistrict.id) {
      return HttpResponse.json(geoDistrict);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.patch('*/api/admin/geo/districts/:id/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...geoDistrict, ...body });
  }),
  http.delete('*/api/admin/geo/districts/:id/', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/admin/geo/upazilas/', () => HttpResponse.json(paginated([geoUpazila], 500))),
  http.get('*/api/admin/geo/upazilas/:id/', ({ params }) => {
    if (Number(params.id) === geoUpazila.id) {
      return HttpResponse.json(geoUpazila);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.get('*/api/admin/geo/unions/', () => HttpResponse.json(paginated([geoUnion], 4500))),
  http.get('*/api/admin/geo/unions/:id/', ({ params }) => {
    if (Number(params.id) === geoUnion.id) {
      return HttpResponse.json(geoUnion);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
];
