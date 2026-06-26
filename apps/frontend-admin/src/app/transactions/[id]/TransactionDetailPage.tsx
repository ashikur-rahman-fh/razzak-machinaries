'use client';

import { adminTransactionsApi, isApiError } from '@razzak-machinaries/shared/api';
import { EmptyState, ErrorState, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useParams, useSearchParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/transactions/hooks';
import { TransactionDetailSkeleton } from '@/transactions/components/TransactionDetailSkeleton';
import { TransactionReadOnlyDetails } from '@/transactions/components/TransactionReadOnlyDetails';

export function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { logout, isLoggingOut } = useAdminAuth();

  const transactionId = Number(params.id);
  const fromQuery = searchParams.get('from');
  const isValidId = Number.isFinite(transactionId) && transactionId > 0;

  const { state, reload } = useAsyncData(async () => {
    if (!isValidId) throw new Error('Invalid transaction id');
    return adminTransactionsApi.getTransaction(transactionId);
  }, [transactionId, isValidId]);

  const transaction = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

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
            fromQuery={fromQuery}
            onChanged={() => void reload()}
          />
        ) : null}
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
