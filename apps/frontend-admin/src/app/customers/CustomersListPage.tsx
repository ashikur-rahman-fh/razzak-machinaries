'use client';

import { adminCustomersApi } from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
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

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import { CustomerMobileCard } from '@/customers/components/CustomerMobileCard';
import { CustomerPaginationSummary } from '@/customers/components/CustomerPaginationSummary';
import { CustomerSearchBar } from '@/customers/components/CustomerSearchBar';
import { CustomerTable } from '@/customers/components/CustomerTable';
import { FEEDBACK_DISMISS_MS } from '@/customers/constants';
import {
  getAsyncData,
  isAsyncInitialLoad,
  useAsyncData,
  useDebouncedValue,
  useLargeScreen,
} from '@/customers/hooks';
import {
  buildListUrl,
  DEFAULT_CUSTOMER_ORDERING,
  parseListState,
  RELEVANCE_CUSTOMER_ORDERING,
  resolveOrderingForSearchChange,
  toListParams,
} from '@/customers/routes';

const SORT_OPTIONS = [
  { value: RELEVANCE_CUSTOMER_ORDERING, labelKey: 'customer.list.sort.relevance' },
  { value: '-createdAt', labelKey: 'customer.list.sort.newest' },
  { value: 'createdAt', labelKey: 'customer.list.sort.oldest' },
  { value: 'fullNameBn', labelKey: 'customer.list.sort.nameBn' },
  { value: 'fullNameEn', labelKey: 'customer.list.sort.nameEn' },
] as const;

export function CustomersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { logout, isLoggingOut } = useAdminAuth();
  const isLargeScreen = useLargeScreen();

  const listState = useMemo(() => parseListState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(listState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const success = searchParams.get('success');
  const [dismissedSuccess, setDismissedSuccess] = useState(false);
  const showSuccess = success === 'created' && !dismissedSuccess;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled input from URL
    setSearchInput(listState.search);
  }, [listState.search]);

  useEffect(() => {
    if (debouncedSearch !== listState.search) {
      router.push(
        buildListUrl({
          ...listState,
          search: debouncedSearch,
          page: 1,
          ordering: resolveOrderingForSearchChange(debouncedSearch, listState.ordering),
        }),
      );
    }
  }, [debouncedSearch, listState, router]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => {
      setDismissedSuccess(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('success');
      const query = params.toString();
      router.replace(query ? `/customers?${query}` : '/customers');
    }, FEEDBACK_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [router, searchParams, showSuccess]);

  const effectiveState = useMemo(
    () => ({ ...listState, search: debouncedSearch }),
    [listState, debouncedSearch],
  );

  const listDeps = [
    effectiveState.page,
    effectiveState.pageSize,
    effectiveState.search,
    effectiveState.ordering,
  ];

  const { state: listState_, reload: reloadList } = useAsyncData(
    () => adminCustomersApi.listCustomers(toListParams(effectiveState)),
    listDeps,
  );

  const navigate = useCallback(
    (next: Partial<typeof listState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  const listData = getAsyncData(listState_);
  const isInitialLoad = isAsyncInitialLoad(listState_);
  const isRefreshing = listState_.status === 'loading' && listData !== null;
  const customers = listData?.results ?? [];
  const totalCount = listData?.count ?? 0;
  const hasSearch = Boolean(effectiveState.search);
  const isSearchPending =
    searchInput !== debouncedSearch || (isRefreshing && Boolean(searchInput.trim()));

  const handleClearSearch = () => {
    setSearchInput('');
    navigate({
      search: '',
      page: 1,
      ordering:
        listState.ordering === RELEVANCE_CUSTOMER_ORDERING
          ? DEFAULT_CUSTOMER_ORDERING
          : listState.ordering,
    });
  };

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="customers-list-page"
        activeRoute="customers"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                <TranslatedText translationKey="customer.list.title" as="span" />
              </h1>
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="customer.list.subtitle" as="span" />
              </p>
            </div>
            <Button asChild>
              <Link href="/customers/new">
                <TranslatedText translationKey="customer.list.addCustomer" as="span" compact />
              </Link>
            </Button>
          </div>

          {showSuccess ? (
            <SuccessAlert
              title={
                <TranslatedText
                  translationKey="customer.create.success"
                  as="span"
                  layout="inline"
                />
              }
              role="status"
            />
          ) : null}

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start">
                <CustomerSearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onClear={handleClearSearch}
                  disabled={isInitialLoad}
                  isSearching={isSearchPending}
                />
                <Select
                  value={effectiveState.ordering}
                  onValueChange={(ordering) => navigate({ ordering, page: 1 })}
                >
                  <SelectTrigger
                    className="w-full shrink-0 lg:w-auto lg:min-w-[12.5rem] lg:max-w-[17.5rem]"
                    aria-label="Sort customers"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.filter(
                      (option) => option.value !== RELEVANCE_CUSTOMER_ORDERING || hasSearch,
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <TranslatedText translationKey={option.labelKey} as="span" compact />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                <CustomerPaginationSummary
                  page={effectiveState.page}
                  pageSize={effectiveState.pageSize}
                  totalCount={totalCount}
                />
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInitialLoad ? (
                <CustomerListSkeleton />
              ) : (
                <>
                  <CustomerTable
                    customers={customers}
                    listState={effectiveState}
                    pageSize={effectiveState.pageSize}
                    isLoading={listState_.status === 'loading'}
                    isRefreshing={isRefreshing}
                    error={listState_.status === 'error' ? listState_.error : null}
                    hasSearch={hasSearch}
                    onRetry={() => void reloadList()}
                    onClearSearch={handleClearSearch}
                    ariaHidden={!isLargeScreen}
                  />

                  <div className="space-y-3 lg:hidden" aria-hidden={isLargeScreen || undefined}>
                    {customers.map((customer) => (
                      <CustomerMobileCard
                        key={customer.id}
                        customer={customer}
                        listState={effectiveState}
                      />
                    ))}
                  </div>

                  {totalCount > 0 ? (
                    <PaginationControls
                      page={effectiveState.page}
                      pageSize={effectiveState.pageSize}
                      totalCount={totalCount}
                      onPageChange={(page) => navigate({ page })}
                      onPageSizeChange={(pageSize) => navigate({ pageSize, page: 1 })}
                      summaryLabel={
                        <CustomerPaginationSummary
                          page={effectiveState.page}
                          pageSize={effectiveState.pageSize}
                          totalCount={totalCount}
                        />
                      }
                      previousLabel={
                        <TranslatedText
                          translationKey="customer.pagination.previous"
                          as="span"
                          compact
                        />
                      }
                      nextLabel={
                        <TranslatedText
                          translationKey="customer.pagination.next"
                          as="span"
                          compact
                        />
                      }
                      pageSizeLabel={
                        <TranslatedText
                          translationKey="customer.pagination.pageSize"
                          as="span"
                          compact
                        />
                      }
                      previousAriaLabel={t('customer.pagination.previous')}
                      nextAriaLabel={t('customer.pagination.next')}
                      pageSizeAriaLabel={t('customer.pagination.pageSize')}
                    />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
