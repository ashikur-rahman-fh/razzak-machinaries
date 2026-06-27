'use client';

import { adminStaffUsersApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference, useTranslation } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  LoadingState,
  PaginationControls,
  RecoverableErrorState,
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
import { RequireAdminAuth, RequireSuperuser } from '@/auth/guards';
import { StaffUserRoleBadge } from '@/staff/components/StaffUserRoleBadge';
import { StaffUserStatusBadge } from '@/staff/components/StaffUserStatusBadge';
import { getStaffErrorMessage } from '@/staff/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData, useDebouncedValue } from '@/staff/hooks';
import {
  buildCreateUrl,
  buildDetailUrl,
  buildListUrl,
  parseListState,
  toListParams,
} from '@/staff/routes';

export function StaffUsersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

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
      router.replace(query ? `/staff-users?${query}` : '/staff-users');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [router, searchParams, showSuccess]);

  const effectiveState = useMemo(
    () => ({ ...listState, search: debouncedSearch }),
    [listState, debouncedSearch],
  );

  const { state: listAsyncState, reload: reloadList } = useAsyncData(
    () => adminStaffUsersApi.listStaffUsers(toListParams(effectiveState)),
    [
      effectiveState.page,
      effectiveState.pageSize,
      effectiveState.search,
      effectiveState.status,
      effectiveState.ordering,
    ],
  );

  const listData = getAsyncData(listAsyncState);
  const navigate = useCallback(
    (next: Partial<typeof listState>) => {
      router.push(buildListUrl({ ...listState, ...next }));
    },
    [listState, router],
  );

  return (
    <RequireAdminAuth>
      <RequireSuperuser>
        <AdminAppShell
          data-testid="staff-users-list-page"
          activeRoute="staff-users"
          onLogout={() => void logout()}
          isLoggingOut={isLoggingOut}
        >
          <div className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  <TranslatedText translationKey="staff.list.title" as="span" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  <TranslatedText translationKey="staff.list.subtitle" as="span" />
                </p>
              </div>
              <Button asChild>
                <Link href={buildCreateUrl()}>
                  <TranslatedText translationKey="staff.list.add" as="span" compact />
                </Link>
              </Button>
            </header>

            {showSuccess ? (
              <SuccessAlert
                title={<TranslatedText translationKey="staff.list.createdSuccess" as="span" />}
                role="status"
              />
            ) : null}

            <Card>
              <CardHeader className="space-y-4 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="search"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t('staff.list.searchPlaceholder')}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    aria-label={t('staff.list.searchPlaceholder')}
                  />
                  <Select
                    value={listState.status || 'all'}
                    onValueChange={(value) =>
                      navigate({
                        status: value === 'all' ? '' : (value as 'active' | 'inactive'),
                        page: 1,
                      })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <TranslatedText translationKey="staff.list.statusAll" as="span" compact />
                      </SelectItem>
                      <SelectItem value="active">
                        <TranslatedText
                          translationKey="staff.list.statusActive"
                          as="span"
                          compact
                        />
                      </SelectItem>
                      <SelectItem value="inactive">
                        <TranslatedText
                          translationKey="staff.list.statusInactive"
                          as="span"
                          compact
                        />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAsyncInitialLoad(listAsyncState) ? (
                  <LoadingState label={t('staff.list.title')} />
                ) : listAsyncState.status === 'error' ? (
                  <RecoverableErrorState
                    message={getStaffErrorMessage(listAsyncState.error, language)}
                    onRetry={() => void reloadList()}
                    retryLabel={language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
                  />
                ) : listData && listData.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="staff.list.empty" as="span" />
                  </p>
                ) : listData ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnName"
                                as="span"
                                compact
                              />
                            </th>
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnUsername"
                                as="span"
                                compact
                              />
                            </th>
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnEmail"
                                as="span"
                                compact
                              />
                            </th>
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnPhone"
                                as="span"
                                compact
                              />
                            </th>
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnRole"
                                as="span"
                                compact
                              />
                            </th>
                            <th className="px-2 py-2 font-medium">
                              <TranslatedText
                                translationKey="staff.list.columnStatus"
                                as="span"
                                compact
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {listData.results.map((staffUser) => (
                            <tr key={staffUser.id} className="border-b hover:bg-muted/40">
                              <td className="px-2 py-3">
                                <Link
                                  href={buildDetailUrl(staffUser.id, effectiveState)}
                                  className="font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                  {staffUser.name}
                                </Link>
                              </td>
                              <td className="px-2 py-3">{staffUser.username}</td>
                              <td className="px-2 py-3">{staffUser.email || '—'}</td>
                              <td className="px-2 py-3">{staffUser.phone || '—'}</td>
                              <td className="px-2 py-3">
                                <StaffUserRoleBadge isSuperuser={staffUser.isSuperuser} />
                              </td>
                              <td className="px-2 py-3">
                                <StaffUserStatusBadge isActive={staffUser.isActive} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={effectiveState.page}
                      pageSize={effectiveState.pageSize}
                      totalCount={listData.count}
                      onPageChange={(page) => navigate({ page })}
                      summaryLabel={
                        language === 'bn'
                          ? `${listData.count} জনের মধ্যে ${(effectiveState.page - 1) * effectiveState.pageSize + 1}–${Math.min(effectiveState.page * effectiveState.pageSize, listData.count)}`
                          : `${(effectiveState.page - 1) * effectiveState.pageSize + 1}–${Math.min(effectiveState.page * effectiveState.pageSize, listData.count)} of ${listData.count}`
                      }
                      previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
                      nextLabel={language === 'bn' ? 'পরের' : 'Next'}
                    />
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </AdminAppShell>
      </RequireSuperuser>
    </RequireAdminAuth>
  );
}
