import { http, HttpResponse } from 'msw';

import { paginatedCustomers, sampleCustomer } from './customer-fixtures';

export const customerMswHandlers = [
  http.get('*/api/admin/customers/', ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const status = url.searchParams.get('status') ?? 'active';
    const results =
      search &&
      !sampleCustomer.fullNameEn.toLowerCase().includes(search) &&
      !sampleCustomer.fullNameBn.includes(search)
        ? []
        : [sampleCustomer];
    const filtered =
      status === 'archived'
        ? results.filter((customer) => customer.isArchived)
        : status === 'all'
          ? results
          : results.filter((customer) => !customer.isArchived);
    return HttpResponse.json(paginatedCustomers(filtered, filtered.length));
  }),
  http.get('*/api/admin/customers/:id/', ({ params }) => {
    if (Number(params.id) === sampleCustomer.id) {
      return HttpResponse.json(sampleCustomer);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.post('*/api/admin/customers/:id/create-version/', async ({ params, request }) => {
    const body = Object.fromEntries((await request.formData()).entries());
    return HttpResponse.json(
      {
        customer: {
          ...sampleCustomer,
          ...body,
          id: Number(params.id),
        },
        version: {
          id: 2,
          versionNumber: 2,
          isCurrent: true,
          previousVersionId: 1,
          fullNameBn: sampleCustomer.fullNameBn,
          fullNameEn: String(body.fullNameEn ?? sampleCustomer.fullNameEn),
          addressBn: sampleCustomer.addressBn,
          addressEn: sampleCustomer.addressEn,
          phoneBn: sampleCustomer.phoneBn,
          phoneEn: sampleCustomer.phoneEn,
          fatherNameBn: sampleCustomer.fatherNameBn,
          fatherNameEn: sampleCustomer.fatherNameEn,
          memoPageNumberBn: sampleCustomer.memoPageNumberBn,
          memoPageNumberEn: sampleCustomer.memoPageNumberEn,
          mediatorNameBn: sampleCustomer.mediatorNameBn,
          mediatorNameEn: sampleCustomer.mediatorNameEn,
          profilePictureUrl: null,
          changeReason: String(body.changeReason ?? ''),
          createdByName: 'admin',
          createdAt: '2026-06-25T10:00:00Z',
        },
        message: 'Customer version created successfully.',
      },
      { status: 201 },
    );
  }),
  http.post('*/api/admin/customers/:id/archive/', async ({ params, request }) => {
    const body = (await request.json()) as { archiveReason?: string };
    return HttpResponse.json({
      customer: {
        ...sampleCustomer,
        id: Number(params.id),
        isArchived: true,
        archivedAt: '2026-06-25T10:00:00Z',
        archiveReason: body.archiveReason ?? '',
      },
      message: 'Customer archived successfully.',
    });
  }),
  http.get('*/api/admin/customers/:id/history/', ({ params }) =>
    HttpResponse.json({
      customerId: Number(params.id),
      versions: [
        {
          id: 1,
          versionNumber: 1,
          isCurrent: true,
          previousVersionId: null,
          fullNameBn: sampleCustomer.fullNameBn,
          fullNameEn: sampleCustomer.fullNameEn,
          addressBn: sampleCustomer.addressBn,
          addressEn: sampleCustomer.addressEn,
          phoneBn: sampleCustomer.phoneBn,
          phoneEn: sampleCustomer.phoneEn,
          fatherNameBn: sampleCustomer.fatherNameBn,
          fatherNameEn: sampleCustomer.fatherNameEn,
          memoPageNumberBn: sampleCustomer.memoPageNumberBn,
          memoPageNumberEn: sampleCustomer.memoPageNumberEn,
          mediatorNameBn: sampleCustomer.mediatorNameBn,
          mediatorNameEn: sampleCustomer.mediatorNameEn,
          profilePictureUrl: null,
          changeReason: '',
          createdByName: 'admin',
          createdAt: sampleCustomer.createdAt,
        },
      ],
    }),
  ),
  http.get('*/api/admin/customers/:id/balance/', ({ params }) => {
    if (Number(params.id) === sampleCustomer.id) {
      return HttpResponse.json({
        customerId: sampleCustomer.id,
        currentBalance: '0.00',
        totalInitial: '0.00',
        totalSales: '0.00',
        totalPayments: '0.00',
        transactionCount: 0,
        cachedBalance: '0.00',
      });
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.get('*/api/admin/customers/:id/transactions/', () =>
    HttpResponse.json(paginatedCustomers([], 0)),
  ),
];
