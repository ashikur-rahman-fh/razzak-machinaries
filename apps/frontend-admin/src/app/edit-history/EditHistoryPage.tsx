'use client';

import { adminEditHistoryApi, type EditHistoryEventType } from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  Input,
  PaginationControls,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth, RequireSuperuser } from '@/auth/guards';
import { CustomerListSkeleton } from '@/customers/components/CustomerDetailSkeleton';
import {
  getAsyncData,
  isAsyncInitialLoad,
  useAsyncData,
  useDebouncedValue,
} from '@/transactions/hooks';

import { EditHistoryTable } from '@/edit-history/components/EditHistoryTable';
import { buildListUrl, parseListState } from '@/edit-history/routes';

const EVENT_TYPE_OPTIONS: Array<{ value: EditHistoryEventType | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'editHistory.filter.all' },
  { value: 'TRANSACTION_CORRECTED', labelKey: 'editHistory.filter.transactionCorrected' },
  { value: 'TRANSACTION_VOIDED', labelKey: 'editHistory.filter.transactionVoided' },
  { value: 'CUSTOMER_EDITED', labelKey: 'editHistory.filter.customerEdited' },
  { value: 'CUSTOMER_ARCHIVED', labelKey: 'editHistory.filter.customerArchived' },
];

export function EditHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { logout, isLoggingOut } = useAdminAuth();

  const listState = useMemo(() => parseListState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(listState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled input from URL
    setSearchInput(listState.search);
  }, [listState.search]);

  useEffect(() => {
    if (debouncedSearch !== listState.search) {
      router.push(buildListUrl({ ...listState, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, listState, router]);

  const effectiveState = useMemo(
    () => ({ ...listState, search: debouncedSearch }),
    [listState, debouncedSearch],
  );

  const { state, reload } = useAsyncData(
    () =>
      adminEditHistoryApi.listEditHistory({
        page: effectiveState.page,
        pageSize: effectiveState.pageSize,
        search: effectiveState.search || undefined,
        eventType: effectiveState.eventType || undefined,
      }),
    [effectiveState.page, effectiveState.pageSize, effectiveState.search, effectiveState.eventType],
  );

  const navigate = useCallback(
    (next: Partial<typeof listState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  const data = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  return (
    <RequireAdminAuth>
      <RequireSuperuser>
        <AdminAppShell
          data-testid="edit-history-page"
          activeRoute="edit-history"
          onLogout={() => void logout()}
          isLoggingOut={isLoggingOut}
        >
          <Card>
            <CardHeader className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                <TranslatedText translationKey="editHistory.title" as="span" layout="inline" />
              </h1>
              <p className="text-sm text-muted-foreground">
                <TranslatedText
                  translationKey="editHistory.description"
                  as="span"
                  layout="inline"
                />
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('editHistory.search')}
                  aria-label={t('editHistory.search')}
                />
                <Select
                  value={listState.eventType || 'all'}
                  onValueChange={(value) =>
                    navigate({
                      eventType: value === 'all' ? '' : (value as EditHistoryEventType),
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('editHistory.filter.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isInitialLoad ? <CustomerListSkeleton /> : null}

              {!isInitialLoad && state.status === 'error' ? (
                <div className="space-y-3">
                  <ErrorState
                    message={
                      <TranslatedText
                        translationKey="editHistory.error"
                        as="span"
                        layout="inline"
                      />
                    }
                  />
                  <button
                    type="button"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => void reload()}
                  >
                    <TranslatedText translationKey="editHistory.retry" as="span" compact />
                  </button>
                </div>
              ) : null}

              {!isInitialLoad && state.status === 'success' && data ? (
                <>
                  <EditHistoryTable events={data.results} />
                  {data.count > effectiveState.pageSize ? (
                    <PaginationControls
                      page={effectiveState.page}
                      pageSize={effectiveState.pageSize}
                      totalCount={data.count}
                      onPageChange={(page) => navigate({ page })}
                      summaryLabel={
                        <span>
                          {effectiveState.page} /{' '}
                          {Math.max(1, Math.ceil(data.count / effectiveState.pageSize))}
                        </span>
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
                    />
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>
        </AdminAppShell>
      </RequireSuperuser>
    </RequireAdminAuth>
  );
}
