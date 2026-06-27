import { http, HttpResponse } from 'msw';

import {
  sampleCustomerFollowUpsResponse,
  sampleDashboardFollowUpsResponse,
  sampleEmptyCustomerFollowUpsResponse,
  sampleEmptyDashboardFollowUpsResponse,
} from './follow-up-fixtures';

export function followUpMswHandlers() {
  return [
    http.get('*/api/admin/customers/:id/follow-ups/', ({ params }) => {
      const customerId = Number(params.id);
      if (customerId === 42) {
        return HttpResponse.json(sampleCustomerFollowUpsResponse);
      }
      return HttpResponse.json(sampleEmptyCustomerFollowUpsResponse);
    }),
    http.post('*/api/admin/customers/:id/follow-ups/', async ({ request }) => {
      const body = (await request.json()) as { followUpDate: string; note?: string };
      return HttpResponse.json(
        {
          ...sampleCustomerFollowUpsResponse.active!,
          followUpDate: body.followUpDate,
          note: body.note ?? '',
        },
        { status: 201 },
      );
    }),
    http.patch('*/api/admin/follow-ups/:id/', async ({ request, params }) => {
      const body = (await request.json()) as { followUpDate?: string; note?: string };
      return HttpResponse.json({
        ...sampleCustomerFollowUpsResponse.active!,
        id: Number(params.id),
        followUpDate: body.followUpDate ?? sampleCustomerFollowUpsResponse.active!.followUpDate,
        note: body.note ?? sampleCustomerFollowUpsResponse.active!.note,
      });
    }),
    http.post('*/api/admin/follow-ups/:id/complete/', async ({ request, params }) => {
      const body = (await request.json()) as { completionNote?: string };
      return HttpResponse.json({
        ...sampleCustomerFollowUpsResponse.active!,
        id: Number(params.id),
        status: 'completed',
        completionNote: body.completionNote ?? '',
        completedByName: 'Admin User',
        completedAt: '2026-06-26T12:00:00Z',
      });
    }),
    http.post('*/api/admin/follow-ups/:id/cancel/', ({ params }) =>
      HttpResponse.json({
        ...sampleCustomerFollowUpsResponse.active!,
        id: Number(params.id),
        status: 'cancelled',
      }),
    ),
    http.get('*/api/admin/dashboard/follow-ups/', () =>
      HttpResponse.json(sampleDashboardFollowUpsResponse),
    ),
  ];
}

export function emptyFollowUpMswHandlers() {
  return [
    http.get('*/api/admin/customers/:id/follow-ups/', () =>
      HttpResponse.json(sampleEmptyCustomerFollowUpsResponse),
    ),
    http.get('*/api/admin/dashboard/follow-ups/', () =>
      HttpResponse.json(sampleEmptyDashboardFollowUpsResponse),
    ),
  ];
}
