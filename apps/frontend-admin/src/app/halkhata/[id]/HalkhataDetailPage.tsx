'use client';

import {
  adminHalkhataApi,
  type Customer,
  type PaymentMethod,
} from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  PaginationControls,
  SuccessAlert,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { FEEDBACK_DISMISS_MS } from '@/halkhata/constants';
import { HalkhataCustomerPaymentSection } from '@/halkhata/components/HalkhataCustomerPaymentSection';
import { HalkhataDetailHeader } from '@/halkhata/components/HalkhataDetailHeader';
import { HalkhataPaymentModal } from '@/halkhata/components/HalkhataPaymentModal';
import { HalkhataPaginationSummary } from '@/halkhata/components/HalkhataPaginationSummary';
import { HalkhataStatsCards } from '@/halkhata/components/HalkhataStatsCards';
import { HalkhataTransactionsTable } from '@/halkhata/components/HalkhataTransactionsTable';
import { getHalkhataErrorMessage } from '@/halkhata/errors';
import {
  getAsyncData,
  isAsyncInitialLoad,
  useAsyncData,
  useDebouncedValue,
} from '@/halkhata/hooks';
import {
  buildDetailTransactionsUrl,
  parseTransactionListState,
  toTransactionListParams,
} from '@/halkhata/routes';
import type { HalkhataPaymentFormValues } from '@/halkhata/validation';

export function HalkhataDetailPage() {
  const params = useParams<{ id: string }>();
  const halkhataId = Number(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();

  const txListState = useMemo(() => parseTransactionListState(searchParams), [searchParams]);
  const [searchInput, setSearchInput] = useState(txListState.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [customerSearchResetKey, setCustomerSearchResetKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled input from URL
    setSearchInput(txListState.search);
  }, [txListState.search]);

  useEffect(() => {
    if (debouncedSearch !== txListState.search) {
      router.push(
        buildDetailTransactionsUrl(halkhataId, {
          ...txListState,
          search: debouncedSearch,
          page: 1,
        }),
      );
    }
  }, [debouncedSearch, halkhataId, router, txListState]);

  const { state: detailState, reload: reloadDetail } = useAsyncData(
    () => adminHalkhataApi.getHalkhata(halkhataId),
    [halkhataId],
  );
  const halkhata = getAsyncData(detailState);

  const { state: statsState, reload: reloadStats } = useAsyncData(
    () => adminHalkhataApi.getHalkhataStats(halkhataId),
    [halkhataId],
  );
  const stats = getAsyncData(statsState);

  const { state: txState, reload: reloadTransactions } = useAsyncData(
    () =>
      adminHalkhataApi.listHalkhataTransactions(
        halkhataId,
        toTransactionListParams({ ...txListState, search: debouncedSearch }),
      ),
    [halkhataId, txListState.page, debouncedSearch],
  );
  const transactions = getAsyncData(txState);

  const handleUpdateNotes = useCallback(
    async (notes: string) => {
      setIsUpdating(true);
      try {
        await adminHalkhataApi.updateHalkhata(halkhataId, { notes });
        await reloadDetail();
      } finally {
        setIsUpdating(false);
      }
    },
    [halkhataId, reloadDetail],
  );

  const handleToggleStatus = useCallback(async () => {
    if (!halkhata) return;
    setIsUpdating(true);
    try {
      await adminHalkhataApi.updateHalkhata(halkhataId, {
        status: halkhata.status === 'active' ? 'closed' : 'active',
      });
      await reloadDetail();
    } finally {
      setIsUpdating(false);
    }
  }, [halkhata, halkhataId, reloadDetail]);

  const handlePayment = useCallback(
    async (values: HalkhataPaymentFormValues) => {
      if (!selectedCustomer) return;
      setIsPaying(true);
      setPaymentError(null);
      try {
        await adminHalkhataApi.createHalkhataPayment(halkhataId, {
          customerId: selectedCustomer.id,
          amount: values.amount,
          date: values.date,
          note: values.note,
          paymentMethod: (values.paymentMethod || undefined) as PaymentMethod | undefined,
        });
        setShowPaymentSuccess(true);
        window.setTimeout(() => setShowPaymentSuccess(false), FEEDBACK_DISMISS_MS);
        await Promise.all([reloadDetail(), reloadStats(), reloadTransactions()]);
        setCustomerSearchResetKey((key) => key + 1);
      } catch (error) {
        setPaymentError(getHalkhataErrorMessage(error, language));
        throw error;
      } finally {
        setIsPaying(false);
      }
    },
    [halkhataId, language, reloadDetail, reloadStats, reloadTransactions, selectedCustomer],
  );

  const isClosed = halkhata?.status === 'closed';

  return (
    <RequireAdminAuth>
      <AdminAppShell activeRoute="halkhata" onLogout={logout} isLoggingOut={isLoggingOut}>
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/halkhata">
              <TranslatedText translationKey="halkhata.detail.back" as="span" compact />
            </Link>
          </Button>
        </div>

        {showPaymentSuccess ? (
          <SuccessAlert
            title={<TranslatedText translationKey="halkhata.payment.success" as="span" />}
            className="mb-4"
            role="status"
          />
        ) : null}

        {detailState.status === 'error' ? (
          <ErrorState
            message={<TranslatedText translationKey="halkhata.detail.loadError" as="span" />}
          />
        ) : null}

        {halkhata ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <HalkhataDetailHeader
                  halkhata={halkhata}
                  onUpdateNotes={handleUpdateNotes}
                  onToggleStatus={handleToggleStatus}
                  isUpdating={isUpdating}
                />
              </CardContent>
            </Card>

            <HalkhataStatsCards
              stats={stats}
              isLoading={isAsyncInitialLoad(statsState) && stats === null}
            />

            <Card>
              <CardContent className="pt-6">
                <HalkhataCustomerPaymentSection
                  halkhataId={halkhataId}
                  disabled={isClosed}
                  clearSearchSignal={customerSearchResetKey}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                    setPaymentOpen(true);
                    setPaymentError(null);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold">
                    <TranslatedText translationKey="halkhata.transactions.title" as="span" />
                  </h2>
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={
                      language === 'bn' ? 'গ্রাহক বা নোট খুঁজুন' : 'Search customer or note'
                    }
                    className="max-w-sm"
                  />
                </div>

                {txState.status === 'success' && transactions?.results.length === 0 ? (
                  <EmptyState
                    title={
                      <TranslatedText
                        translationKey="halkhata.transactions.empty"
                        as="span"
                        layout="inline"
                      />
                    }
                  />
                ) : (
                  <HalkhataTransactionsTable
                    items={transactions?.results ?? []}
                    isLoading={isAsyncInitialLoad(txState) && transactions === null}
                  />
                )}

                {transactions && transactions.count > 0 ? (
                  <PaginationControls
                    page={txListState.page}
                    pageSize={25}
                    totalCount={transactions.count}
                    onPageChange={(page) =>
                      router.push(buildDetailTransactionsUrl(halkhataId, { ...txListState, page }))
                    }
                    summaryLabel={
                      <HalkhataPaginationSummary
                        page={txListState.page}
                        pageSize={25}
                        totalCount={transactions.count}
                      />
                    }
                    previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
                    nextLabel={language === 'bn' ? 'পরের' : 'Next'}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <HalkhataPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          customer={selectedCustomer}
          onSubmit={handlePayment}
          isLoading={isPaying}
          errorMessage={paymentError}
        />
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
