'use client';

import { isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  EmptyState,
  ErrorState,
  PageShell,
  RecoverableErrorState,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { BangladeshAddressDetailHeader } from '@/bangladesh-address/components/BangladeshAddressDetailHeader';
import { BangladeshAddressDetailSkeleton } from '@/bangladesh-address/components/BangladeshAddressDetailSkeleton';
import { BangladeshAddressNameEditor } from '@/bangladesh-address/components/BangladeshAddressNameEditor';
import { BangladeshAddressReadOnlyDetails } from '@/bangladesh-address/components/BangladeshAddressReadOnlyDetails';
import { ConfirmDeleteModal } from '@/bangladesh-address/components/ConfirmDeleteModal';
import { getGeoConfig } from '@/bangladesh-address/config';
import { getGeoDeleteErrorMessage } from '@/bangladesh-address/errors';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/bangladesh-address/hooks';
import { loadParentLookup } from '@/bangladesh-address/parent-lookup';
import { buildEditUrl, getBackListUrl } from '@/bangladesh-address/routes';
import { isGeoResourceType } from '@/bangladesh-address/types';

const FEEDBACK_DISMISS_MS = 5000;

export function BangladeshAddressDetailPage() {
  const params = useParams<{ geoType: string; id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const geoTypeParam = params.geoType;
  const recordId = Number(params.id);
  const fromQuery = searchParams.get('from');
  const success = searchParams.get('success');
  const backHref = getBackListUrl(fromQuery);

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dismissedRedirectSuccess, setDismissedRedirectSuccess] = useState(false);
  const showRedirectSuccess = success === 'updated' && !dismissedRedirectSuccess;

  const dismissRedirectSuccess = useCallback(() => {
    setDismissedRedirectSuccess(true);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('success');
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const isValidType = isGeoResourceType(geoTypeParam);
  const geoType = isValidType ? geoTypeParam : 'divisions';
  const config = isValidType ? getGeoConfig(geoType) : null;

  const { state: recordState, reload: reloadRecord } = useAsyncData(async () => {
    if (!config || !recordId) throw new Error('Invalid');
    return config.get(recordId);
  }, [geoTypeParam, recordId]);

  const parentResource = config?.parentResource;
  const { state: parentLookupState } = useAsyncData(
    () => loadParentLookup(parentResource),
    [parentResource],
  );

  useEffect(() => {
    if (!showRedirectSuccess) return;
    const timer = window.setTimeout(() => dismissRedirectSuccess(), FEEDBACK_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismissRedirectSuccess, showRedirectSuccess]);

  async function handleDelete() {
    if (!config || recordState.status !== 'success' || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await config.delete(recordState.data.id);
      router.push(`${backHref}${backHref.includes('?') ? '&' : '?'}success=deleted`);
    } catch (err) {
      setDeleteError(getGeoDeleteErrorMessage(err, language));
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isValidType) {
    return (
      <RequireAdminAuth>
        <PageShell header={<AdminNavbar activeRoute="bangladesh-address" />}>
          <ErrorState
            message={<TranslatedText translationKey="geo.invalidType" as="span" layout="inline" />}
          />
        </PageShell>
      </RequireAdminAuth>
    );
  }

  const record = getAsyncData(recordState);
  const parentLookup = parentLookupState.status === 'success' ? parentLookupState.data : new Map();
  const isInitialLoading = isAsyncInitialLoad(recordState);
  const isNotFound =
    recordState.status === 'error' && isApiError(recordState.error) && recordState.error.isNotFound;
  const isLoadError = recordState.status === 'error' && !isNotFound;

  const headerActions = record ? (
    <>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={buildEditUrl(geoType, record.id)}>
          <TranslatedText translationKey="geo.actions.edit" as="span" compact />
        </Link>
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => {
          setDeleteError(null);
          setShowDelete(true);
        }}
      >
        <TranslatedText translationKey="geo.actions.delete" as="span" compact />
      </Button>
    </>
  ) : null;

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="geo-detail-page"
        header={
          <AdminNavbar
            activeRoute="bangladesh-address"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
          {showRedirectSuccess ? (
            <SuccessAlert
              className="animate-in fade-in slide-in-from-top-2 duration-300"
              title={
                <TranslatedText translationKey="geo.update.success" as="span" layout="inline" />
              }
              role="status"
              aria-live="polite"
              data-testid="geo-detail-success"
            />
          ) : null}

          {isInitialLoading ? <BangladeshAddressDetailSkeleton /> : null}

          {isNotFound ? (
            <EmptyState
              title={
                <TranslatedText translationKey="geo.detail.notFound" as="span" layout="inline" />
              }
              description={
                <TranslatedText
                  translationKey="geo.detail.notFoundDescription"
                  as="span"
                  layout="inline"
                />
              }
              action={
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={backHref}>
                    <TranslatedText
                      translationKey="geo.actions.backToBangladeshAddressList"
                      as="span"
                      compact
                    />
                  </Link>
                </Button>
              }
            />
          ) : null}

          {isLoadError ? (
            <RecoverableErrorState
              message={
                <TranslatedText translationKey="geo.detail.loadError" as="span" layout="inline" />
              }
              onRetry={() => void reloadRecord()}
              retryLabel={<TranslatedText translationKey="geo.list.retry" as="span" compact />}
              backHref={backHref}
              backLabel={
                <TranslatedText
                  translationKey="geo.actions.backToBangladeshAddressList"
                  as="span"
                  compact
                />
              }
            />
          ) : null}

          {record ? (
            <>
              <BangladeshAddressDetailHeader
                geoType={geoType}
                nameEn={record.nameEn}
                sourceId={record.id}
                backHref={backHref}
                actions={headerActions}
              />
              <BangladeshAddressNameEditor
                key={record.id}
                record={record}
                onSubmit={async (payload) => {
                  if (!config) return;
                  await config.update(record.id, payload);
                }}
                onSaved={() => reloadRecord()}
              />
              <BangladeshAddressReadOnlyDetails
                geoType={geoType}
                record={record}
                parentLookup={parentLookup}
              />
            </>
          ) : null}
        </div>

        {record ? (
          <ConfirmDeleteModal
            open={showDelete}
            onOpenChange={(open) => {
              if (!isDeleting) {
                setShowDelete(open);
                if (!open) setDeleteError(null);
              }
            }}
            recordName={record.nameEn}
            onConfirm={handleDelete}
            isLoading={isDeleting}
            errorMessage={deleteError}
          />
        ) : null}
      </PageShell>
    </RequireAdminAuth>
  );
}
