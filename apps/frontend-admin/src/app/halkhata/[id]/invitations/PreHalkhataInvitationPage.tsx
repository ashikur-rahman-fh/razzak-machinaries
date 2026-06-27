'use client';

import {
  adminHalkhataInvitationsApi,
  isApiError,
  type HalkhataInvitationGenerationWrite,
} from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  ConfirmDialog,
  RecoverableErrorState,
  Skeleton,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

import { CustomerInvitationSelector } from '@/halkhata/invitations/CustomerInvitationSelector';
import { InvitationGenerationHistory } from '@/halkhata/invitations/InvitationGenerationHistory';
import { InvitationGenerationSummary } from '@/halkhata/invitations/InvitationGenerationSummary';
import {
  canGenerateInvitations,
  createManualSelectionState,
  getSelectedCustomerCount,
  INVITATION_CUSTOMER_PAGE_SIZE,
  INVITATION_LARGE_BATCH_THRESHOLD,
  type InvitationSelectionState,
} from '@/halkhata/invitations/utils';
import { buildDetailUrl, buildInvitationPrintUrl } from '@/halkhata/routes';

export function PreHalkhataInvitationPage() {
  const params = useParams<{ id: string }>();
  const halkhataId = Number(params.id);
  const router = useRouter();
  const { language, t } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const [selection, setSelection] = useState<InvitationSelectionState>(createManualSelectionState);
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [mediator, setMediator] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { state: pageState } = useAsyncData(
    () => adminHalkhataInvitationsApi.getInvitationPageContext(halkhataId),
    [halkhataId],
  );

  const customerParams = useMemo(
    () => ({
      page,
      pageSize: INVITATION_CUSTOMER_PAGE_SIZE,
      search: search || undefined,
      address: address || undefined,
      mediator: mediator || undefined,
      ordering: 'fullNameBn',
    }),
    [page, search, address, mediator],
  );

  const { state: customersState } = useAsyncData(
    () => adminHalkhataInvitationsApi.listInvitationCustomers(halkhataId, customerParams),
    [halkhataId, customerParams],
  );

  const { state: historyState } = useAsyncData(
    () =>
      adminHalkhataInvitationsApi.listInvitationGenerations(halkhataId, {
        page: historyPage,
        pageSize: 10,
      }),
    [halkhataId, historyPage],
  );

  const pageContext = getAsyncData(pageState);
  const customersData = getAsyncData(customersState);
  const historyData = getAsyncData(historyState);
  const isLoading = isAsyncInitialLoad(pageState);
  const readOnly = pageContext ? !pageContext.canGenerate : false;
  const selectedCount = pageContext ? getSelectedCustomerCount(selection, pageContext) : 0;
  const canGenerate = pageContext ? canGenerateInvitations(selection, pageContext) : false;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    setPage(1);
  }, []);

  const handleMediatorChange = useCallback((value: string) => {
    setMediator(value);
    setPage(1);
  }, []);

  function handleReuseSelection(generation: { selectedCustomerIds: number[] }) {
    setSelection({ mode: 'manual', ids: new Set(generation.selectedCustomerIds) });
    setSuccessMessage(t('halkhata.invitations.reuseSuccess'));
  }

  async function performGenerate() {
    if (!pageContext) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const body: HalkhataInvitationGenerationWrite =
        selection.mode === 'manual'
          ? {
              selectionMode: 'manual',
              customerIds: Array.from(selection.ids),
            }
          : { selectionMode: selection.mode };

      const generation = await adminHalkhataInvitationsApi.createInvitationGeneration(
        halkhataId,
        body,
      );
      router.push(buildInvitationPrintUrl(halkhataId, generation.id));
    } catch (error) {
      setGenerateError(isApiError(error) ? error.message : t('halkhata.invitations.generateError'));
    } finally {
      setIsGenerating(false);
      setConfirmOpen(false);
    }
  }

  function handleGenerateClick() {
    if (!canGenerate || readOnly) return;
    if (selectedCount > INVITATION_LARGE_BATCH_THRESHOLD) {
      setConfirmOpen(true);
      return;
    }
    void performGenerate();
  }

  const generateLabelKey =
    pageContext && pageContext.generationCount > 0
      ? 'halkhata.invitations.generateNewVersion'
      : 'halkhata.invitations.generate';

  return (
    <RequireAdminAuth>
      <AdminAppShell
        activeRoute="halkhata"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={buildDetailUrl(halkhataId)}>
                  <TranslatedText
                    translationKey="halkhata.invitations.backToDetail"
                    as="span"
                    compact
                  />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight">
                <TranslatedText translationKey="halkhata.invitations.title" as="span" />
              </h1>
            </div>
            <Button
              type="button"
              disabled={!canGenerate || readOnly || isGenerating}
              onClick={handleGenerateClick}
            >
              {isGenerating ? (
                <TranslatedText
                  translationKey="halkhata.invitations.generating"
                  as="span"
                  compact
                />
              ) : (
                <TranslatedText translationKey={generateLabelKey} as="span" compact />
              )}
            </Button>
          </div>

          {successMessage ? (
            <SuccessAlert title={successMessage} className="mb-4" role="status" />
          ) : null}
          {generateError ? (
            <RecoverableErrorState
              message={generateError}
              onRetry={() => void performGenerate()}
              retryLabel={language === 'bn' ? 'আবার চেষ্টা' : 'Retry'}
            />
          ) : null}

          {readOnly ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <TranslatedText translationKey="halkhata.invitations.closedReadOnly" as="span" />
            </div>
          ) : null}

          {isLoading || !pageContext ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <InvitationGenerationSummary context={pageContext} selection={selection} />
              <CustomerInvitationSelector
                customers={customersData?.results ?? []}
                totalCount={customersData?.count ?? 0}
                page={page}
                isLoading={isAsyncInitialLoad(customersState)}
                selection={selection}
                totalActiveCustomers={pageContext.totalActiveCustomers}
                totalDueCustomers={pageContext.totalDueCustomers}
                readOnly={readOnly}
                onPageChange={setPage}
                onSearchChange={handleSearchChange}
                onAddressChange={handleAddressChange}
                onMediatorChange={handleMediatorChange}
                onSelectionChange={setSelection}
              />
              <InvitationGenerationHistory
                halkhataId={halkhataId}
                generations={historyData?.results ?? []}
                totalCount={historyData?.count ?? 0}
                page={historyPage}
                pageSize={10}
                onPageChange={setHistoryPage}
                onReuseSelection={readOnly ? undefined : handleReuseSelection}
              />
            </>
          )}
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('halkhata.invitations.confirmLargeTitle')}
          description={
            language === 'bn'
              ? `আপনি ${selectedCount} জন গ্রাহকের জন্য দাওয়াতনামা তৈরি করতে যাচ্ছেন। চালিয়ে যাবেন?`
              : `You are about to generate invitations for ${selectedCount} customers. Continue?`
          }
          confirmLabel={t('halkhata.invitations.generate')}
          cancelLabel={language === 'bn' ? 'বাতিল' : 'Cancel'}
          onConfirm={() => void performGenerate()}
          isLoading={isGenerating}
        />
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
