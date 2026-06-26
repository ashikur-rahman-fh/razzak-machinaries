'use client';

import { adminDashboardApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { RecoverableErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useMemo, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

import { DashboardCharts } from './components/DashboardCharts';
import { DashboardKpiCards } from './components/DashboardKpiCards';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { RecentCustomersTable } from './components/RecentCustomersTable';
import { RecentTransactionsTable } from './components/RecentTransactionsTable';

export function DashboardPage() {
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { state, reload } = useAsyncData(
    () => adminDashboardApi.getDashboard({ year: selectedYear }),
    [selectedYear],
  );

  const data = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-BD', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [language],
  );

  const availableYears = data?.yearlyStats.availableYears ?? [currentYear];

  return (
    <RequireAdminAuth>
      <AdminAppShell
        activeRoute="dashboard"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
        contentClassName="max-w-7xl"
        data-testid="dashboard-page"
      >
        <div className="space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight font-display">
              <TranslatedText translationKey="dashboard.title" as="span" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="dashboard.subtitle" as="span" />
            </p>
            <p className="text-xs text-muted-foreground">
              <TranslatedText translationKey="dashboard.today" as="span" compact />: {todayLabel}
            </p>
          </div>

          {state.status === 'error' && !data ? (
            <RecoverableErrorState
              message={
                <TranslatedText translationKey="dashboard.loadError" as="span" layout="inline" />
              }
              onRetry={() => void reload()}
              retryLabel={<TranslatedText translationKey="dashboard.retry" as="span" compact />}
            />
          ) : null}

          {isInitialLoad ? <DashboardSkeleton /> : null}

          {data ? (
            <>
              <DashboardKpiCards
                summary={data.summary}
                yearlyStats={data.yearlyStats}
                isLoading={state.status === 'loading'}
              />

              <DashboardCharts
                yearlyStats={data.yearlyStats}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={setSelectedYear}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <RecentTransactionsTable transactions={data.recentTransactions} />
                <RecentCustomersTable customers={data.recentCustomers} />
              </div>
            </>
          ) : null}
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
