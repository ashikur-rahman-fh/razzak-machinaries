import { http, HttpResponse } from 'msw';

import { paginatedCustomers, sampleCustomer } from './customer-fixtures';

export const customerMswHandlers = [
  http.get('*/api/admin/customers/', ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const results =
      search &&
      !sampleCustomer.fullNameEn.toLowerCase().includes(search) &&
      !sampleCustomer.fullNameBn.includes(search)
        ? []
        : [sampleCustomer];
    return HttpResponse.json(paginatedCustomers(results, results.length));
  }),
  http.get('*/api/admin/customers/:id/', ({ params }) => {
    if (Number(params.id) === sampleCustomer.id) {
      return HttpResponse.json(sampleCustomer);
    }
    return HttpResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }),
  http.patch('*/api/admin/customers/:id/', async ({ params, request }) => {
    const body = Object.fromEntries((await request.formData()).entries());
    return HttpResponse.json({
      ...sampleCustomer,
      ...body,
      id: Number(params.id),
    });
  }),
  http.delete('*/api/admin/customers/:id/', () => new HttpResponse(null, { status: 204 })),
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
