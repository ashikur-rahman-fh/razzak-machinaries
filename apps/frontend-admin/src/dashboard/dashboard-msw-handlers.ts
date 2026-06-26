import { http, HttpResponse } from 'msw';

import { sampleDashboardData } from './dashboard-fixtures';

export function dashboardMswHandlers() {
  return [
    http.get('*/api/admin/dashboard/', ({ request }) => {
      const url = new URL(request.url);
      const year = Number(url.searchParams.get('year') ?? sampleDashboardData.yearlyStats.year);
      return HttpResponse.json({
        ...sampleDashboardData,
        yearlyStats: {
          ...sampleDashboardData.yearlyStats,
          year,
          yearlySalesTotal:
            year === 2025 ? '100.00' : sampleDashboardData.yearlyStats.yearlySalesTotal,
        },
      });
    }),
  ];
}
