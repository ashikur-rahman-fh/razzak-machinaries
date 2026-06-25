'use client';

import { isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageShell,
  RecoverableErrorState,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { BangladeshAddressEditForm } from '@/bangladesh-address/components/BangladeshAddressEditForm';
import { getGeoConfig } from '@/bangladesh-address/config';
import { getGeoUpdateErrorMessage } from '@/bangladesh-address/errors';
import { useAsyncData } from '@/bangladesh-address/hooks';
import { loadParentLookup } from '@/bangladesh-address/parent-lookup';
import { buildDetailUrl, buildListUrl } from '@/bangladesh-address/routes';
import { isGeoResourceType } from '@/bangladesh-address/types';
export function BangladeshAddressEditPage() {
  const params = useParams<{ geoType: string; id: string }>();
  const router = useRouter();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const geoTypeParam = params.geoType;
  const recordId = Number(params.id);
  const [serverError, setServerError] = useState<string | null>(null);

  const isValidType = isGeoResourceType(geoTypeParam);
  const geoType = isValidType ? geoTypeParam : 'divisions';
  const config = isValidType ? getGeoConfig(geoType) : null;

  const { state: recordState, reload: reloadRecord } = useAsyncData(async () => {
    if (!config || !recordId) throw new Error('Invalid');
    return config.get(recordId);
  }, [geoTypeParam, recordId]);

  const parentResource = config?.parentResource;
  const { state: parentOptionsState } = useAsyncData(
    () => loadParentLookup(parentResource),
    [parentResource],
  );

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

  const record = recordState.status === 'success' ? recordState.data : null;
  const backListHref = buildListUrl({ type: geoType });
  const isNotFound =
    recordState.status === 'error' && isApiError(recordState.error) && recordState.error.isNotFound;
  const isLoadError = recordState.status === 'error' && !isNotFound;
  const parentOptions =
    parentOptionsState.status === 'success' ? parentOptionsState.data : new Map();

  const parentLabelKey =
    config?.parentIdField === 'divisionId'
      ? 'geo.field.parentDivision'
      : config?.parentIdField === 'districtId'
        ? 'geo.field.parentDistrict'
        : config?.parentIdField === 'upazilaId'
          ? 'geo.field.parentUpazila'
          : undefined;

  return (
    <RequireAdminAuth>
      <PageShell
        data-testid="geo-edit-page"
        header={
          <AdminNavbar
            activeRoute="bangladesh-address"
            onLogout={() => void logout()}
            isLoggingOut={isLoggingOut}
          />
        }
      >
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <CardTitle>
                <TranslatedText translationKey="geo.edit.title" as="span" />
              </CardTitle>
              {record ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={buildDetailUrl(geoType, record.id)}>
                    <TranslatedText translationKey="geo.actions.backToList" as="span" compact />
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {recordState.status === 'loading' || recordState.status === 'idle' ? (
                <LoadingState
                  label={
                    <TranslatedText translationKey="common.loading" as="span" layout="inline" />
                  }
                />
              ) : null}

              {isNotFound ? (
                <EmptyState
                  title={
                    <TranslatedText
                      translationKey="geo.detail.notFound"
                      as="span"
                      layout="inline"
                    />
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
                      <Link href={backListHref}>
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
                    <TranslatedText translationKey="geo.edit.loadError" as="span" layout="inline" />
                  }
                  onRetry={() => void reloadRecord()}
                  retryLabel={<TranslatedText translationKey="geo.list.retry" as="span" compact />}
                  backHref={backListHref}
                  backLabel={
                    <TranslatedText
                      translationKey="geo.actions.backToBangladeshAddressList"
                      as="span"
                      compact
                    />
                  }
                />
              ) : null}

              {record && config ? (
                <BangladeshAddressEditForm
                  geoType={geoType}
                  record={record}
                  parentOptions={parentOptions}
                  parentLabelKey={parentLabelKey}
                  onSubmit={async (values) => {
                    setServerError(null);
                    const payload: Record<string, string | number> = {
                      nameEn: values.nameEn,
                      nameBn: values.nameBn,
                    };
                    if (config.parentIdField && values.parentId) {
                      payload[config.parentIdField] = values.parentId;
                    }
                    try {
                      await config.update(record.id, payload);
                      router.push(`${buildDetailUrl(geoType, record.id)}?success=updated`);
                    } catch (err) {
                      setServerError(getGeoUpdateErrorMessage(err, language));
                      throw err;
                    }
                  }}
                  onCancel={() => router.push(buildDetailUrl(geoType, record.id))}
                  serverError={serverError}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </RequireAdminAuth>
  );
}
