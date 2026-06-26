'use client';

import type { DashboardYearlyStats } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardChartsProps = {
  yearlyStats: DashboardYearlyStats | null;
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
};

const CHART_COLORS = {
  sales: '#d97706',
  payments: '#059669',
  netDue: '#2563eb',
  initial: '#7c3aed',
  topDue: '#b45309',
} as const;

function monthLabel(monthName: string): string {
  return monthName.slice(0, 3);
}

export function DashboardCharts({
  yearlyStats,
  selectedYear,
  availableYears,
  onYearChange,
}: DashboardChartsProps) {
  const { language } = useLanguagePreference();

  const salesPaymentsData =
    yearlyStats?.monthlySalesPayments.map((item) => ({
      month: monthLabel(item.monthName),
      sales: Number(item.sales),
      payments: Number(item.payments),
    })) ?? [];

  const dueChangeData =
    yearlyStats?.monthlyDueChange.map((item) => ({
      month: monthLabel(item.monthName),
      netDueChange: Number(item.netDueChange),
    })) ?? [];

  const countsData =
    yearlyStats?.monthlyTransactionCounts.map((item) => ({
      month: monthLabel(item.monthName),
      salesCount: item.salesCount,
      paymentsCount: item.paymentsCount,
      initialCount: item.initialCount,
    })) ?? [];

  const topCustomersData =
    yearlyStats?.topCustomersByDue.map((item) => ({
      name: language === 'bn' ? item.customerNameBn : item.customerNameEn,
      balance: Number(item.currentBalance),
    })) ?? [];

  const formatTooltipValue = (value: number) => formatBdt(value, language);

  return (
    <div className="space-y-6" data-testid="dashboard-charts">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold font-display">
          <TranslatedText translationKey="dashboard.charts.salesVsPayments" as="span" />
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <TranslatedText translationKey="dashboard.charts.yearLabel" as="span" compact />
          </span>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => onYearChange(Number(value))}
          >
            <SelectTrigger className="w-[120px]" data-testid="dashboard-year-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <TranslatedText translationKey="dashboard.charts.salesVsPayments" as="span" />
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesPaymentsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => formatBdt(v, language)}
                width={80}
              />
              <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
              <Legend />
              <Bar
                dataKey="sales"
                name={language === 'bn' ? 'বিক্রয়' : 'Sales'}
                fill={CHART_COLORS.sales}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="payments"
                name={language === 'bn' ? 'পেমেন্ট' : 'Payments'}
                fill={CHART_COLORS.payments}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <TranslatedText translationKey="dashboard.charts.monthlyDueChange" as="span" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dueChangeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatBdt(v, language)}
                  width={80}
                />
                <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
                <Bar
                  dataKey="netDueChange"
                  name={language === 'bn' ? 'বাকি পরিবর্তন' : 'Net due change'}
                  fill={CHART_COLORS.netDue}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <TranslatedText translationKey="dashboard.charts.transactionCounts" as="span" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={countsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="salesCount"
                  name={language === 'bn' ? 'বিক্রয়' : 'Sales'}
                  stroke={CHART_COLORS.sales}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="paymentsCount"
                  name={language === 'bn' ? 'পেমেন্ট' : 'Payments'}
                  stroke={CHART_COLORS.payments}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="initialCount"
                  name={language === 'bn' ? 'শুরুর বাকি' : 'Initial'}
                  stroke={CHART_COLORS.initial}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {topCustomersData.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <TranslatedText translationKey="dashboard.charts.topCustomersByDue" as="span" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomersData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tickFormatter={(v: number) => formatBdt(v, language)} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
                <Bar dataKey="balance" fill={CHART_COLORS.topDue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
