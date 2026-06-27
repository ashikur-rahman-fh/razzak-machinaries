'use client';

import { adminHalkhataApi, type HalkhataStatus } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  PaginationControls,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { CreateHalkhataModal } from '@/halkhata/components/CreateHalkhataModal';
import { HalkhataListTable } from '@/halkhata/components/HalkhataListTable';
import { HalkhataPaginationSummary } from '@/halkhata/components/HalkhataPaginationSummary';
import { getHalkhataErrorMessage } from '@/halkhata/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/halkhata/hooks';
import {
  buildDetailUrl,
  buildListUrl,
  parseListState,
  toListParams,
  type CreateHalkhataFormValues,
} from '@/halkhata/routes';

export function HalkhataListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const listState = useMemo(() => parseListState(searchParams), [searchParams]);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const navigate = useCallback(
    (next: Partial<typeof listState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  const { state: listStateAsync, reload: reloadList } = useAsyncData(
    () => adminHalkhataApi.listHalkhatas(toListParams(listState)),
    [listState.page, listState.status],
  );
  const listData = getAsyncData(listStateAsync);
  const isInitialLoad = isAsyncInitialLoad(listStateAsync);

  const handleCreate = useCallback(
    async (values: CreateHalkhataFormValues) => {
      setIsCreating(true);
      setCreateError(null);
      try {
        const created = await adminHalkhataApi.createHalkhata(values);
        setCreateOpen(false);
        router.push(buildDetailUrl(created.id));
      } catch (error) {
        setCreateError(getHalkhataErrorMessage(error, language));
      } finally {
        setIsCreating(false);
      }
    },
    [language, router],
  );

  return (
    <RequireAdminAuth>
      <AdminAppShell activeRoute="halkhata" onLogout={logout} isLoggingOut={isLoggingOut}>
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              <TranslatedText translationKey="halkhata.list.title" as="span" />
            </h1>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <TranslatedText translationKey="halkhata.list.create" as="span" compact />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Select
                value={listState.status || 'all'}
                onValueChange={(value) =>
                  navigate({
                    status: value === 'all' ? '' : (value as HalkhataStatus),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <TranslatedText translationKey="halkhata.list.statusAll" as="span" compact />
                  </SelectItem>
                  <SelectItem value="active">
                    <TranslatedText translationKey="halkhata.status.active" as="span" compact />
                  </SelectItem>
                  <SelectItem value="closed">
                    <TranslatedText translationKey="halkhata.status.closed" as="span" compact />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listStateAsync.status === 'error' ? (
              <div className="space-y-3">
                <ErrorState
                  message={<TranslatedText translationKey="halkhata.list.loadError" as="span" />}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void reloadList()}>
                  Retry
                </Button>
              </div>
            ) : null}

            {listStateAsync.status === 'success' && listData?.results.length === 0 ? (
              <EmptyState
                title={
                  <TranslatedText translationKey="halkhata.list.empty" as="span" layout="inline" />
                }
              />
            ) : null}

            {(isInitialLoad || (listData?.results.length ?? 0) > 0) &&
            listStateAsync.status !== 'error' ? (
              <HalkhataListTable items={listData?.results ?? []} isLoading={isInitialLoad} />
            ) : null}

            {listData && listData.count > 0 ? (
              <PaginationControls
                page={listState.page}
                pageSize={25}
                totalCount={listData.count}
                onPageChange={(page) => navigate({ page })}
                summaryLabel={
                  <HalkhataPaginationSummary
                    page={listState.page}
                    pageSize={25}
                    totalCount={listData.count}
                  />
                }
                previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
                nextLabel={language === 'bn' ? 'পরের' : 'Next'}
              />
            ) : null}
          </CardContent>
        </Card>

        <CreateHalkhataModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          isLoading={isCreating}
          errorMessage={createError}
        />
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
