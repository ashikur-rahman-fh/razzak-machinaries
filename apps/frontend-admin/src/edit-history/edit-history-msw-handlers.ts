import { http, HttpResponse } from 'msw';

import { paginatedEditHistory, sampleEditHistoryEvents } from './edit-history-fixtures';

export function editHistoryMswHandlers() {
  return [
    http.get('*/api/admin/edit-history/', ({ request }) => {
      const url = new URL(request.url);
      const eventType = url.searchParams.get('eventType');
      const search = (url.searchParams.get('search') ?? '').toLowerCase();

      let results = [...sampleEditHistoryEvents];
      if (eventType) {
        results = results.filter((event) => event.eventType === eventType);
      }
      if (search) {
        results = results.filter((event) =>
          [
            event.entityLabelEn,
            event.entityLabelBn,
            event.reason ?? '',
            event.transactionDisplayId ?? '',
            event.actorName ?? '',
          ].some((value) => value.toLowerCase().includes(search)),
        );
      }

      return HttpResponse.json(paginatedEditHistory(results, results.length));
    }),
  ];
}
