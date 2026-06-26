'use client';

import { adminTransactionsApi, isApiError } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import {
  Button,
  EmptyState,
  ErrorState,
  PageShell,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AdminNavbar } from '@/components/AdminNavbar';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

import { TransactionConfirmationReceipt } from '@/transactions/components/TransactionConfirmationReceipt';
import { buildDetailUrl, buildListUrl } from '@/transactions/routes';

export function TransactionConfirmationPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const transactionId = Number(params.id);
  const fromDetail = searchParams.get('from') === 'detail';
  const { language } = useLanguagePreference();
  const { logout, isLoggingOut } = useAdminAuth();
  const [isBakiToggled, setIsBakiToggled] = useState(false);
  const [bakiSyncKey, setBakiSyncKey] = useState('');

  const { state, reload } = useAsyncData(
    () => adminTransactionsApi.getTransactionConfirmation(transactionId),
    [transactionId],
  );

  const isLoading = isAsyncInitialLoad(state);
  const data = getAsyncData(state);
  const defaultShowBaki = data?.transactionType === 'PAYMENT';
  const currentBakiSyncKey = `${transactionId}:${data?.transactionType ?? ''}`;

  if (currentBakiSyncKey !== bakiSyncKey) {
    setBakiSyncKey(currentBakiSyncKey);
    setIsBakiToggled(false);
  }

  const showCurrentBaki = isBakiToggled ? !defaultShowBaki : defaultShowBaki;

  function handlePrint() {
    window.print();
  }

  return (
    <RequireAdminAuth>
      <PageShell
        header={
          <div className="print:hidden">
            <AdminNavbar
              activeRoute="transactions"
              onLogout={() => void logout()}
              isLoggingOut={isLoggingOut}
            />
          </div>
        }
      >
        <div className="print:hidden mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {fromDetail ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildDetailUrl(transactionId)}>
                  <TranslatedText
                    translationKey="transaction.confirmation.backToTransaction"
                    as="span"
                    compact
                  />
                </Link>
              </Button>
            ) : null}
            {data ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/customers/${data.customerId}`}>
                  <TranslatedText
                    translationKey="transaction.confirmation.backToCustomer"
                    as="span"
                    compact
                  />
                </Link>
              </Button>
            ) : !fromDetail ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildListUrl()}>
                  <TranslatedText
                    translationKey="transaction.confirmation.backToList"
                    as="span"
                    compact
                  />
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="!h-auto min-h-8 whitespace-normal py-1.5"
              aria-pressed={showCurrentBaki}
              onClick={() => setIsBakiToggled((current) => !current)}
            >
              <TranslatedText
                translationKey="transaction.confirmation.showBaki"
                as="span"
                compact
              />
            </Button>
            {data ? (
              <Button type="button" size="sm" onClick={handlePrint}>
                <TranslatedText translationKey="transaction.confirmation.print" as="span" compact />
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div
            className="mx-auto h-[720px] max-w-[210mm] animate-pulse rounded-lg border bg-muted print:hidden"
            aria-hidden
          />
        ) : null}

        {!isLoading && state.status === 'error' ? (
          <div className="space-y-4 print:hidden">
            <ErrorState
              message={
                isApiError(state.error) && state.error.code === 'CONFIRMATION_NOT_AVAILABLE'
                  ? language === 'bn'
                    ? 'শুরুর বাকির লেনদেনের জন্য প্রিন্টযোগ্য রসিদ নেই।'
                    : 'Initial balance transactions do not have a printable confirmation.'
                  : language === 'bn'
                    ? 'লেনদেনের রসিদ লোড করা যায়নি।'
                    : 'Could not load the transaction confirmation.'
              }
            />
            <Button type="button" variant="outline" onClick={() => void reload()}>
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
            </Button>
          </div>
        ) : null}

        {!isLoading && state.status === 'success' && !data ? (
          <EmptyState
            title={language === 'bn' ? 'লেনদেন পাওয়া যায়নি' : 'Transaction not found'}
          />
        ) : null}

        {data ? (
          <TransactionConfirmationReceipt data={data} showCurrentBaki={showCurrentBaki} />
        ) : null}
      </PageShell>
    </RequireAdminAuth>
  );
}
