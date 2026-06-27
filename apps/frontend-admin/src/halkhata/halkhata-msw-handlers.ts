import { http, HttpResponse } from 'msw';

import {
  sampleHalkhata,
  sampleHalkhataStats,
  sampleHalkhataTransactions,
} from './halkhata-fixtures';
import {
  sampleInvitationCustomers,
  sampleInvitationGeneration,
  sampleInvitationPageContext,
} from './invitation-fixtures';

let nextHalkhataId = 3;
let nextInvitationGenerationId = 11;

const listHalkhatas = [
  { ...sampleHalkhata, id: 1, title: 'Summer Collection 2026', status: 'active' as const },
  {
    ...sampleHalkhata,
    id: 2,
    title: 'Winter Collection 2025',
    date: '2025-12-15',
    status: 'closed' as const,
    totalCollected: '900.00',
    paymentCount: 2,
  },
];

export function halkhataMswHandlers(options?: { status?: 'active' | 'closed' }) {
  const status = options?.status ?? 'active';
  return [
    http.get('*/api/admin/halkhatas/', ({ request }) => {
      const url = new URL(request.url);
      const statusFilter = url.searchParams.get('status');
      const results =
        statusFilter === 'active' || statusFilter === 'closed'
          ? listHalkhatas.filter((item) => item.status === statusFilter)
          : listHalkhatas;

      return HttpResponse.json({
        count: results.length,
        next: null,
        previous: null,
        results,
      });
    }),
    http.post('*/api/admin/halkhatas/', async ({ request }) => {
      const body = (await request.json()) as { title: string; date: string };
      const created = {
        ...sampleHalkhata,
        id: nextHalkhataId++,
        title: body.title,
        date: body.date,
        totalCollected: '0.00',
        paymentCount: 0,
        status,
      };
      return HttpResponse.json(created, { status: 201 });
    }),
    http.get('*/api/admin/halkhatas/:id/', ({ params }) =>
      HttpResponse.json({
        ...sampleHalkhata,
        id: Number(params.id),
        status,
      }),
    ),
    http.patch('*/api/admin/halkhatas/:id/', async ({ request, params }) => {
      const body = (await request.json()) as Partial<typeof sampleHalkhata>;
      return HttpResponse.json({
        ...sampleHalkhata,
        id: Number(params.id),
        ...body,
      });
    }),
    http.get('*/api/admin/halkhatas/:id/stats/', () => HttpResponse.json(sampleHalkhataStats)),
    http.get('*/api/admin/halkhatas/:id/transactions/', () =>
      HttpResponse.json({
        count: sampleHalkhataTransactions.length,
        next: null,
        previous: null,
        results: sampleHalkhataTransactions,
      }),
    ),
    http.post('*/api/admin/halkhatas/:id/payments/', async ({ request }) => {
      const body = (await request.json()) as { amount: string };
      return HttpResponse.json(
        {
          id: 999,
          transactionType: 'PAYMENT',
          totalAmount: body.amount,
        },
        { status: 201 },
      );
    }),
    http.get('*/api/admin/halkhatas/:id/invitations/', ({ params }) =>
      HttpResponse.json({
        ...sampleInvitationPageContext,
        halkhataId: Number(params.id),
        canGenerate: status === 'active',
      }),
    ),
    http.get('*/api/admin/halkhatas/:id/invitations/customers/', () =>
      HttpResponse.json({
        count: sampleInvitationCustomers.length,
        next: null,
        previous: null,
        results: sampleInvitationCustomers,
      }),
    ),
    http.get('*/api/admin/halkhatas/:id/invitations/generations/', () =>
      HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: sampleInvitationGeneration.id,
            generatedByName: sampleInvitationGeneration.generatedByName,
            generatedAt: sampleInvitationGeneration.generatedAt,
            customerSelectionMode: sampleInvitationGeneration.customerSelectionMode,
            customerCount: sampleInvitationGeneration.customerCount,
            selectedCustomerIds: sampleInvitationGeneration.selectedCustomerIds,
            status: sampleInvitationGeneration.status,
            notes: sampleInvitationGeneration.notes,
            createdAt: sampleInvitationGeneration.createdAt,
            updatedAt: sampleInvitationGeneration.updatedAt,
          },
        ],
      }),
    ),
    http.post('*/api/admin/halkhatas/:id/invitations/generations/', async ({ request, params }) => {
      const body = (await request.json()) as {
        selectionMode: string;
        customerIds?: number[];
      };
      const generationId = nextInvitationGenerationId++;
      const recipients =
        body.selectionMode === 'manual' && body.customerIds?.length
          ? sampleInvitationGeneration.recipients.filter((recipient) =>
              body.customerIds?.includes(recipient.customerId),
            )
          : sampleInvitationGeneration.recipients;

      return HttpResponse.json(
        {
          ...sampleInvitationGeneration,
          id: generationId,
          halkhataId: Number(params.id),
          customerCount: recipients.length,
          selectedCustomerIds: recipients.map((recipient) => recipient.customerId),
          recipients,
        },
        { status: 201 },
      );
    }),
    http.get('*/api/admin/halkhatas/:id/invitations/generations/:generationId/', ({ params }) =>
      HttpResponse.json({
        ...sampleInvitationGeneration,
        id: Number(params.generationId),
        halkhataId: Number(params.id),
      }),
    ),
  ];
}
