'use client';

import { adminTransactionsApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/transactions/hooks';
import { buildDetailUrl } from '@/transactions/routes';
import { TransactionDetailSkeleton } from '@/transactions/components/TransactionDetailSkeleton';
import { TransactionStatusBadge } from '@/transactions/components/TransactionStatusBadge';

export function TransactionHistoryPage() {
  const params = useParams<{ id: string }>();
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();
  const transactionId = Number(params.id);
  const isValidId = Number.isFinite(transactionId) && transactionId > 0;

  const { state, reload } = useAsyncData(async () => {
    if (!isValidId) throw new Error('Invalid transaction id');
    return adminTransactionsApi.getTransactionHistory(transactionId);
  }, [transactionId, isValidId]);

  const history = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  return (
    <RequireAdminAuth>
      <AdminAppShell
        data-testid="transaction-history-page"
        activeRoute="transactions"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <Link
              href={buildDetailUrl(transactionId)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              <TranslatedText translationKey="transaction.history.back" as="span" compact />
            </Link>
            <h1 className="text-2xl font-semibold">
              <TranslatedText translationKey="transaction.history.title" as="span" />
            </h1>
          </div>

          {isInitialLoad ? <TransactionDetailSkeleton /> : null}

          {!isInitialLoad && state.status === 'error' ? (
            <div className="space-y-3">
              <ErrorState
                message={
                  <TranslatedText
                    translationKey="transaction.history.loadError"
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
          ) : null}

          {history && history.versions.length === 0 ? (
            <EmptyState
              title={
                <TranslatedText
                  translationKey="transaction.history.empty"
                  as="span"
                  layout="inline"
                />
              }
            />
          ) : null}

          {history?.versions.map((version) => (
            <Card key={version.id}>
              <CardContent className="space-y-3 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">
                      <TranslatedText
                        translationKey="transaction.history.version"
                        as="span"
                        compact
                      />{' '}
                      {version.versionNumber} — {version.displayId}
                    </p>
                    <p className="text-sm text-muted-foreground">{version.date}</p>
                  </div>
                  <TransactionStatusBadge status={version.status} />
                </div>
                <p className="text-xl font-semibold">{formatBdt(version.totalAmount, language)}</p>
                {version.previousVersionId ? (
                  <p className="text-sm">
                    <TranslatedText
                      translationKey="transaction.detail.correctedFrom"
                      as="span"
                      compact
                    />{' '}
                    <Link
                      href={buildDetailUrl(version.previousVersionId)}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      COM-{version.previousVersionId}
                    </Link>
                  </p>
                ) : null}
                {version.editReason ? (
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="transaction.correct.reason" as="span" compact />
                    : {version.editReason}
                  </p>
                ) : null}
                {version.voidReason ? (
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="transaction.void.reason" as="span" compact />:{' '}
                    {version.voidReason}
                  </p>
                ) : null}
                <Link
                  href={buildDetailUrl(version.id)}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <TranslatedText
                    translationKey="transaction.history.viewVersion"
                    as="span"
                    compact
                  />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
