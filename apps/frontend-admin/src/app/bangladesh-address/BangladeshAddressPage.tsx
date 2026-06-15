'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PaginationControls,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PageShell,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { BangladeshAddressStatsCards } from '@/bangladesh-address/components/BangladeshAddressStatsCards';
import { BangladeshAddressTable } from '@/bangladesh-address/components/BangladeshAddressTable';
import { BangladeshAddressTypeTabs } from '@/bangladesh-address/components/BangladeshAddressTypeTabs';
import { PaginationSummary } from '@/bangladesh-address/components/PaginationSummary';
import { VillageImportPanel } from '@/bangladesh-address/components/VillageImportPanel';
import { getGeoConfig } from '@/bangladesh-address/config';
import {
  getAsyncData,
  getAsyncResetKey,
  isAsyncInitialLoad,
  useAsyncData,
  useDebouncedValue,
} from '@/bangladesh-address/hooks';
import { loadGeoStats, loadParentLookup } from '@/bangladesh-address/parent-lookup';
import { buildListUrl, parseListState, toListParams } from '@/bangladesh-address/routes';
import type { GeoListState, GeoResourceType } from '@/bangladesh-address/types';

export function BangladeshAddressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { logout, isLoggingOut } = useAdminAuth();

  const listState = useMemo(() => parseListState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(listState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    // Keep the search field in sync when the URL changes (tabs, back/forward, clear filters).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled input from URL
    setSearchInput(listState.search);
  }, [listState.search]);

  useEffect(() => {
    if (debouncedSearch !== listState.search) {
      router.push(buildListUrl({ ...listState, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, listState, router]);

  const navigate = useCallback(
    (next: Partial<GeoListState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  const effectiveState = useMemo(
    () => ({ ...listState, search: debouncedSearch }),
    [listState, debouncedSearch],
  );

  const listDeps = [
    effectiveState.type,
    effectiveState.page,
    effectiveState.pageSize,
    effectiveState.search,
    effectiveState.ordering,
    effectiveState.divisionId,
    effectiveState.districtId,
    effectiveState.upazilaId,
  ];

  const { state: statsState, reload: reloadStats } = useAsyncData(() => loadGeoStats(), []);
  const { state: listDataState, reload: reloadList } = useAsyncData(
    async () => {
      const config = getGeoConfig(effectiveState.type);
      return config.list(toListParams(effectiveState));
    },
    listDeps,
    { resetKey: effectiveState.type },
  );

  const parentResource = getGeoConfig(effectiveState.type).parentResource;
  const filterParentResource =
    effectiveState.type === 'districts'
      ? 'divisions'
      : effectiveState.type === 'upazilas'
        ? 'districts'
        : effectiveState.type === 'unions'
          ? 'upazilas'
          : undefined;

  const { state: parentLookupState } = useAsyncData(
    () => loadParentLookup(parentResource),
    [parentResource],
  );
  const { state: filterLookupState } = useAsyncData(
    () => loadParentLookup(filterParentResource),
    [filterParentResource],
  );

  const handleTypeChange = (type: GeoResourceType) => {
    navigate({
      type,
      page: 1,
      search: '',
      divisionId: undefined,
      districtId: undefined,
      upazilaId: undefined,
    });
    setSearchInput('');
  };

  const handleClearFilters = () => {
    navigate({
      page: 1,
      search: '',
      divisionId: undefined,
      districtId: undefined,
      upazilaId: undefined,
    });
    setSearchInput('');
  };

  const hasSearchOrFilters = Boolean(
    effectiveState.search ||
    effectiveState.divisionId ||
    effectiveState.districtId ||
    effectiveState.upazilaId,
  );

  const rawListData = getAsyncData(listDataState);
  const listResetKey = getAsyncResetKey(listDataState);
  const displayListData = rawListData && listResetKey === effectiveState.type ? rawListData : null;
  const isListRefreshing = listDataState.status === 'loading' && displayListData !== null;
  const parentLookup = parentLookupState.status === 'success' ? parentLookupState.data : new Map();
  const filterLookup = filterLookupState.status === 'success' ? filterLookupState.data : new Map();

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="bangladesh-address-page"
        contentClassName="max-w-full"
        header={
          <AdminNavbar
            activeRoute="bangladesh-address"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        <div className="flex w-full flex-col gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight font-display">
              <TranslatedText translationKey="geo.title" as="span" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <TranslatedText translationKey="geo.subtitle" as="span" />
            </p>
          </div>

          <BangladeshAddressStatsCards
            stats={statsState.status === 'success' ? statsState.data : null}
            isLoading={statsState.status === 'loading' || statsState.status === 'idle'}
            error={statsState.status === 'error' ? statsState.error : null}
            onRetry={() => void reloadStats()}
          />

          {effectiveState.type === 'villages' ? (
            <VillageImportPanel
              onImportSuccess={() => {
                void reloadList();
                void reloadStats();
              }}
            />
          ) : null}

          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>
                  <TranslatedText translationKey={`geo.type.${effectiveState.type}`} as="span" />
                </CardTitle>
                <CardDescription>
                  <TranslatedText translationKey="geo.subtitle" as="span" />
                </CardDescription>
              </div>
              <BangladeshAddressTypeTabs
                activeType={effectiveState.type}
                onTypeChange={handleTypeChange}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <div className="min-w-[220px] flex-1">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder={
                        effectiveState.type === 'districts'
                          ? t('geo.search.placeholderDistricts')
                          : t('geo.search.placeholder')
                      }
                      aria-label={
                        effectiveState.type === 'districts'
                          ? t('geo.search.placeholderDistricts')
                          : t('geo.search.placeholder')
                      }
                      data-testid="geo-search-input"
                    />
                  </div>

                  {effectiveState.type === 'districts' ? (
                    <Select
                      value={effectiveState.divisionId ? String(effectiveState.divisionId) : 'all'}
                      onValueChange={(value) =>
                        navigate({
                          divisionId: value === 'all' ? undefined : Number(value),
                          page: 1,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full sm:w-[200px]"
                        aria-label={t('geo.filter.division')}
                      >
                        <SelectValue placeholder={t('geo.filter.division')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <TranslatedText
                            translationKey="geo.filter.allDivisions"
                            as="span"
                            compact
                          />
                        </SelectItem>
                        {Array.from(filterLookup.entries())
                          .sort((a, b) => a[1].nameEn.localeCompare(b[1].nameEn))
                          .map(([id, names]) => (
                            <SelectItem key={id} value={String(id)}>
                              {names.nameEn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {effectiveState.type === 'upazilas' ? (
                    <Select
                      value={effectiveState.districtId ? String(effectiveState.districtId) : 'all'}
                      onValueChange={(value) =>
                        navigate({
                          districtId: value === 'all' ? undefined : Number(value),
                          page: 1,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full sm:w-[200px]"
                        aria-label={t('geo.filter.district')}
                      >
                        <SelectValue placeholder={t('geo.filter.district')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <TranslatedText
                            translationKey="geo.filter.allDistricts"
                            as="span"
                            compact
                          />
                        </SelectItem>
                        {Array.from(filterLookup.entries())
                          .sort((a, b) => a[1].nameEn.localeCompare(b[1].nameEn))
                          .map(([id, names]) => (
                            <SelectItem key={id} value={String(id)}>
                              {names.nameEn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {effectiveState.type === 'unions' ? (
                    <Select
                      value={effectiveState.upazilaId ? String(effectiveState.upazilaId) : 'all'}
                      onValueChange={(value) =>
                        navigate({
                          upazilaId: value === 'all' ? undefined : Number(value),
                          page: 1,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full sm:w-[200px]"
                        aria-label={t('geo.filter.upazila')}
                      >
                        <SelectValue placeholder={t('geo.filter.upazila')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <TranslatedText
                            translationKey="geo.filter.allUpazilas"
                            as="span"
                            compact
                          />
                        </SelectItem>
                        {Array.from(filterLookup.entries())
                          .sort((a, b) => a[1].nameEn.localeCompare(b[1].nameEn))
                          .map(([id, names]) => (
                            <SelectItem key={id} value={String(id)}>
                              {names.nameEn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void reloadList()}
                  >
                    <TranslatedText translationKey="geo.actions.refresh" as="span" compact />
                  </Button>
                  {hasSearchOrFilters ? (
                    <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                      <TranslatedText translationKey="geo.actions.clearFilters" as="span" compact />
                    </Button>
                  ) : null}
                </div>
              </div>

              <BangladeshAddressTable
                geoType={effectiveState.type}
                records={displayListData?.results ?? []}
                listState={effectiveState}
                parentLookup={parentLookup}
                pageSize={effectiveState.pageSize}
                isLoading={isAsyncInitialLoad(listDataState)}
                isRefreshing={isListRefreshing}
                error={listDataState.status === 'error' ? listDataState.error : null}
                hasSearchOrFilters={hasSearchOrFilters}
                onRetry={() => void reloadList()}
                onClearSearch={handleClearFilters}
                onDeleteSuccess={() => {
                  void reloadList();
                  void reloadStats();
                }}
              />

              {displayListData ? (
                <PaginationControls
                  page={effectiveState.page}
                  pageSize={effectiveState.pageSize}
                  totalCount={displayListData.count}
                  onPageChange={(page) => navigate({ page })}
                  onPageSizeChange={(pageSize) => navigate({ pageSize, page: 1 })}
                  summaryLabel={
                    <PaginationSummary
                      page={effectiveState.page}
                      pageSize={effectiveState.pageSize}
                      totalCount={displayListData.count}
                      typeTranslationKey={`geo.type.${effectiveState.type}`}
                    />
                  }
                  previousLabel={
                    <TranslatedText translationKey="geo.pagination.previous" as="span" compact />
                  }
                  nextLabel={
                    <TranslatedText translationKey="geo.pagination.next" as="span" compact />
                  }
                  pageSizeLabel={
                    <TranslatedText translationKey="geo.pagination.pageSize" as="span" compact />
                  }
                  previousAriaLabel={t('geo.pagination.previous')}
                  nextAriaLabel={t('geo.pagination.next')}
                  pageSizeAriaLabel={t('geo.pagination.pageSize')}
                  isLoading={listDataState.status === 'loading'}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </RequireAdminAuth>
  );
}
