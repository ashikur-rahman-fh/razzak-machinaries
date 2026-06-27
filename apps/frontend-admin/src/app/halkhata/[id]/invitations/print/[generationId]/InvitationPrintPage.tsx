'use client';

import { adminHalkhataInvitationsApi } from '@razzak-machinaries/shared/api';
import { EmptyState, RecoverableErrorState, Skeleton } from '@razzak-machinaries/shared/ui';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AdminAppShell } from '@/components/AdminAppShell';
import { useAdminAuth } from '@/auth/AdminAuthProvider';
import { RequireAdminAuth } from '@/auth/guards';
import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

import { HalkhataInvitationCard } from '@/halkhata/invitations/HalkhataInvitationCard';
import { PrintToolbar, type InvitationPrintLayout } from '@/halkhata/invitations/PrintToolbar';
import '@/halkhata/invitations/print.css';

export function InvitationPrintPage() {
  const params = useParams<{ id: string; generationId: string }>();
  const halkhataId = Number(params.id);
  const generationId = Number(params.generationId);
  const { logout, isLoggingOut } = useAdminAuth();
  const [layout, setLayout] = useState<InvitationPrintLayout>('one');

  const { state, reload } = useAsyncData(
    () => adminHalkhataInvitationsApi.getInvitationGeneration(halkhataId, generationId),
    [halkhataId, generationId],
  );

  const data = getAsyncData(state);
  const isLoading = isAsyncInitialLoad(state);

  function handlePrint() {
    window.print();
  }

  function renderCards() {
    if (!data) return null;
    const recipients = [...data.recipients].sort((a, b) => a.sortOrder - b.sortOrder);
    const cardLayout = layout === 'one' ? 'full' : 'half';
    const pageClass =
      layout === 'one' ? 'invitation-page' : 'invitation-page invitation-page--half';

    return recipients.map((recipient) => (
      <div key={`${recipient.customerId}-${recipient.sortOrder}`} className={pageClass}>
        <HalkhataInvitationCard
          recipient={recipient}
          halkhataDate={data.halkhataDate}
          generatedAt={data.generatedAt}
          layout={cardLayout}
        />
      </div>
    ));
  }

  return (
    <RequireAdminAuth>
      <AdminAppShell
        activeRoute="halkhata"
        onLogout={() => void logout()}
        isLoggingOut={isLoggingOut}
      >
        <div className="print-page mx-auto max-w-5xl space-y-6 pb-10 print:max-w-none print:space-y-0 print:p-0 print:pb-0">
          {isLoading ? (
            <Skeleton className="no-print h-24 w-full" />
          ) : data ? (
            <PrintToolbar
              halkhataId={halkhataId}
              halkhataTitle={data.halkhataTitle}
              halkhataDate={data.halkhataDate}
              invitationCount={data.customerCount}
              layout={layout}
              onLayoutChange={setLayout}
              onPrint={handlePrint}
            />
          ) : null}

          {state.status === 'error' ? (
            <RecoverableErrorState
              message={
                state.error instanceof Error
                  ? state.error.message
                  : 'Could not load invitation generation.'
              }
              onRetry={() => void reload()}
              retryLabel="Retry"
            />
          ) : null}

          {state.status === 'success' && data && data.recipients.length === 0 ? (
            <EmptyState title="No invitations in this generation." />
          ) : null}

          <div className="invitation-pages flex flex-col gap-8 print:gap-0">{renderCards()}</div>
        </div>
      </AdminAppShell>
    </RequireAdminAuth>
  );
}
