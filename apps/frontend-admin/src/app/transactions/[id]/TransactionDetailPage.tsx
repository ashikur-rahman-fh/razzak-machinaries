'use client';

import { adminTransactionsApi, isApiError } from '@razzak-machinaries/shared/api';
import { EmptyState, ErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { canAccessEditHistory } from '@/auth/permissions';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/transactions/hooks';
import { TransactionDetailSkeleton } from '@/transactions/components/TransactionDetailSkeleton';
import { TransactionReadOnlyDetails } from '@/transactions/components/TransactionReadOnlyDetails';
import { buildDetailUrl } from '@/transactions/routes';

export function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAdminAuth();
  const showVersionContext = canAccessEditHistory(user);

  const transactionId = Number(params.id);
  const fromQuery = searchParams.get('from');
  const isValidId = Number.isFinite(transactionId) && transactionId > 0;

  const { state, reload } = useAsyncData(async () => {
    if (!isValidId) throw new Error('Invalid transaction id');
    const transaction = await adminTransactionsApi.getTransaction(transactionId);
    const previousTransaction =
      showVersionContext && transaction.previousVersionId != null
        ? await adminTransactionsApi.getTransaction(transaction.previousVersionId)
        : null;
    return { transaction, previousTransaction };
  }, [transactionId, isValidId, showVersionContext]);

  const data = getAsyncData(state);
  const transaction = data?.transaction;
  const previousTransaction = data?.previousTransaction ?? null;
  const isInitialLoad = isAsyncInitialLoad(state);

  useEffect(() => {
    if (!transaction || transaction.id === transactionId) {
      return;
    }
    const path = buildDetailUrl(transaction.id);
    const href = fromQuery ? `${path}?from=${encodeURIComponent(fromQuery)}` : path;
    router.replace(href);
  }, [transaction, transactionId, fromQuery, router]);

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="transaction-detail-page"
        activeRoute="transactions"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        {!isValidId ? (
          <EmptyState
            title={
              <TranslatedText
                translationKey="transaction.detail.notFound"
                as="span"
                layout="inline"
              />
            }
          />
        ) : null}

        {isValidId && isInitialLoad ? <TransactionDetailSkeleton /> : null}

        {isValidId && !isInitialLoad && state.status === 'error' ? (
          isApiError(state.error) && state.error.isNotFound ? (
            <EmptyState
              title={
                <TranslatedText
                  translationKey="transaction.detail.notFound"
                  as="span"
                  layout="inline"
                />
              }
            />
          ) : (
            <div className="space-y-3">
              <ErrorState
                message={
                  <TranslatedText
                    translationKey="transaction.detail.loadError"
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
                Retry
              </button>
            </div>
          )
        ) : null}

        {transaction ? (
          <TransactionReadOnlyDetails
            transaction={transaction}
            previousTransaction={previousTransaction}
            fromQuery={fromQuery}
            onChanged={() => void reload()}
          />
        ) : null}
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
