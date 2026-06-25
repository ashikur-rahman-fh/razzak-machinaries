'use client';

import { adminTransactionsApi, type TransactionType } from '@razzak-machinaries/shared/api';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  Input,
  PageShell,
  PaginationControls,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { FEEDBACK_DISMISS_MS } from '@/customers/constants';
import { TransactionMobileCard } from '@/transactions/components/TransactionMobileCard';
import { TransactionPaginationSummary } from '@/transactions/components/TransactionPaginationSummary';
import { TransactionTable } from '@/transactions/components/TransactionTable';
import {
  getAsyncData,
  isAsyncInitialLoad,
  useAsyncData,
  useDebouncedValue,
  useLargeScreen,
} from '@/transactions/hooks';
import {
  buildListUrl,
  DEFAULT_TRANSACTION_ORDERING,
  parseListState,
  toListParams,
} from '@/transactions/routes';

const SORT_OPTIONS = [
  { value: '-date', labelKey: 'transaction.list.sort.dateDesc' },
  { value: 'date', labelKey: 'transaction.list.sort.dateAsc' },
  { value: '-createdAt', labelKey: 'transaction.list.sort.newest' },
  { value: 'createdAt', labelKey: 'transaction.list.sort.oldest' },
] as const;

const TYPE_OPTIONS: Array<{ value: TransactionType | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'transaction.list.filter.typeAll' },
  { value: 'INITIAL', labelKey: 'transaction.type.initial' },
  { value: 'SALE', labelKey: 'transaction.type.sale' },
  { value: 'PAYMENT', labelKey: 'transaction.type.payment' },
];

export function TransactionsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();
  const isLargeScreen = useLargeScreen();

  const listState = useMemo(() => parseListState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(listState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const success = searchParams.get('success');
  const [dismissedSuccess, setDismissedSuccess] = useState(false);
  const showSuccess = success === 'transactionCreated' && !dismissedSuccess;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled input from URL
    setSearchInput(listState.search);
  }, [listState.search]);

  useEffect(() => {
    if (debouncedSearch !== listState.search) {
      router.push(buildListUrl({ ...listState, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, listState, router]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => {
      setDismissedSuccess(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('success');
      const query = params.toString();
      router.replace(query ? `/transactions?${query}` : '/transactions');
    }, FEEDBACK_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [router, searchParams, showSuccess]);

  const effectiveState = useMemo(
    () => ({ ...listState, search: debouncedSearch }),
    [listState, debouncedSearch],
  );

  const { state: listDataState, reload } = useAsyncData(
    () => adminTransactionsApi.listTransactions(toListParams(effectiveState)),
    [
      effectiveState.page,
      effectiveState.pageSize,
      effectiveState.search,
      effectiveState.ordering,
      effectiveState.customerId,
      effectiveState.transactionType,
      effectiveState.dateFrom,
      effectiveState.dateTo,
    ],
  );

  const navigate = useCallback(
    (next: Partial<typeof listState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  const data = getAsyncData(listDataState);
  const isInitialLoad = isAsyncInitialLoad(listDataState);

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="transactions-list-page"
        header={
          <AdminNavbar
            activeRoute="transactions"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        {showSuccess ? (
          <SuccessAlert
            title={
              <TranslatedText
                translationKey="transaction.create.success"
                as="span"
                layout="inline"
              />
            }
            role="status"
            className="mb-6"
          />
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              <TranslatedText translationKey="transaction.list.title" as="span" layout="inline" />
            </h1>
            <Button asChild>
              <Link href="/transactions/new">
                <TranslatedText translationKey="transaction.list.new" as="span" compact />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-4">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('transaction.list.search')}
                aria-label={t('transaction.list.search')}
              />
              <Select
                value={listState.transactionType || 'all'}
                onValueChange={(value) =>
                  navigate({
                    transactionType: value === 'all' ? '' : (value as TransactionType),
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transaction.list.filter.type')} />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={listState.dateFrom}
                onChange={(event) => navigate({ dateFrom: event.target.value, page: 1 })}
                aria-label={t('transaction.list.filter.dateFrom')}
              />
              <Input
                type="date"
                value={listState.dateTo}
                onChange={(event) => navigate({ dateTo: event.target.value, page: 1 })}
                aria-label={t('transaction.list.filter.dateTo')}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TransactionPaginationSummary
                page={effectiveState.page}
                pageSize={effectiveState.pageSize}
                totalCount={data?.count ?? 0}
              />
              <Select
                value={listState.ordering || DEFAULT_TRANSACTION_ORDERING}
                onValueChange={(value) => navigate({ ordering: value, page: 1 })}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isInitialLoad ? <CustomerListSkeleton /> : null}

            {!isInitialLoad && listDataState.status === 'error' ? (
              <div className="space-y-3">
                <ErrorState
                  message={
                    <TranslatedText translationKey="transaction.list.loadError" as="span" compact />
                  }
                />
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => void reload()}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {data && data.results.length === 0 && listDataState.status === 'success' ? (
              <EmptyState
                title={<TranslatedText translationKey="transaction.list.empty" as="span" compact />}
              />
            ) : null}

            {data && data.results.length > 0 ? (
              <div className="relative">
                {isLargeScreen ? (
                  <TransactionTable transactions={data.results} />
                ) : (
                  <div className="space-y-3">
                    {data.results.map((transaction) => (
                      <TransactionMobileCard key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {data && data.count > 0 ? (
              <PaginationControls
                page={effectiveState.page}
                pageSize={effectiveState.pageSize}
                totalCount={data.count}
                onPageChange={(page) => navigate({ page })}
                summaryLabel={
                  <TransactionPaginationSummary
                    page={effectiveState.page}
                    pageSize={effectiveState.pageSize}
                    totalCount={data.count}
                  />
                }
                previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
                nextLabel={language === 'bn' ? 'পরের' : 'Next'}
              />
            ) : null}
          </CardContent>
        </Card>
      </PageShell>
    </RequireAdminAuth>
  );
}
