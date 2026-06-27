'use client';

import { adminFollowUpsApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { SuccessAlert, TranslatedText } from '@razzak-machinaries/shared/ui';
import { useState } from 'react';

import {
  FollowUpCancelDialog,
  FollowUpCompleteDialog,
} from '@/follow-ups/components/FollowUpActionDialogs';
import { FollowUpCard } from '@/follow-ups/components/FollowUpCard';
import { FollowUpHistoryTable } from '@/follow-ups/components/FollowUpHistoryTable';
import { FollowUpModal } from '@/follow-ups/components/FollowUpModal';
import { getFollowUpErrorMessage } from '@/follow-ups/errors';
import { getAsyncData, isAsyncInitialLoad, useCustomerFollowUps } from '@/follow-ups/hooks';
import type { FollowUpFormValues } from '@/follow-ups/validation';

type CustomerFollowUpPanelProps = {
  customerId: number;
  isArchived: boolean;
};

type SuccessKind = 'created' | 'updated' | 'completed' | 'cancelled';

export function CustomerFollowUpPanel({ customerId, isArchived }: CustomerFollowUpPanelProps) {
  const { language } = useLanguagePreference();
  const { state, reload } = useCustomerFollowUps(customerId);
  const data = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);

  const [showHistory, setShowHistory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'reschedule'>('create');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successKind, setSuccessKind] = useState<SuccessKind | null>(null);

  const active = data?.active ?? null;
  const history = data?.history ?? [];

  function openCreate() {
    setModalMode('create');
    setActionError(null);
    setModalOpen(true);
  }

  function openReschedule() {
    setModalMode('reschedule');
    setActionError(null);
    setModalOpen(true);
  }

  async function handleSave(values: FollowUpFormValues) {
    setIsSaving(true);
    setActionError(null);
    try {
      if (modalMode === 'create') {
        await adminFollowUpsApi.createCustomerFollowUp(customerId, {
          followUpDate: values.followUpDate,
          note: values.note,
        });
        setSuccessKind('created');
      } else if (active) {
        await adminFollowUpsApi.updateFollowUp(active.id, {
          followUpDate: values.followUpDate,
          note: values.note,
        });
        setSuccessKind('updated');
      }
      setModalOpen(false);
      await reload();
    } catch (error) {
      setActionError(getFollowUpErrorMessage(error, language));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete(completionNote: string) {
    if (!active) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await adminFollowUpsApi.completeFollowUp(active.id, { completionNote });
      setCompleteOpen(false);
      setSuccessKind('completed');
      await reload();
    } catch (error) {
      setActionError(getFollowUpErrorMessage(error, language));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel() {
    if (!active) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await adminFollowUpsApi.cancelFollowUp(active.id);
      setCancelOpen(false);
      setSuccessKind('cancelled');
      await reload();
    } catch (error) {
      setActionError(getFollowUpErrorMessage(error, language));
    } finally {
      setIsSaving(false);
    }
  }

  if (isInitialLoad) {
    return (
      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="h-24 animate-pulse rounded-md bg-muted" />
      </section>
    );
  }

  const successKey =
    successKind === 'created'
      ? 'followUp.success.created'
      : successKind === 'updated'
        ? 'followUp.success.updated'
        : successKind === 'completed'
          ? 'followUp.success.completed'
          : successKind === 'cancelled'
            ? 'followUp.success.cancelled'
            : null;

  return (
    <div className="space-y-4" data-testid="customer-follow-up-panel">
      {successKey ? (
        <SuccessAlert
          title={<TranslatedText translationKey={successKey} as="span" />}
          role="status"
        />
      ) : null}

      <FollowUpCard
        active={active}
        isArchived={isArchived}
        onSetFollowUp={openCreate}
        onReschedule={openReschedule}
        onComplete={() => {
          setActionError(null);
          setCompleteOpen(true);
        }}
        onCancel={() => {
          setActionError(null);
          setCancelOpen(true);
        }}
        onToggleHistory={() => setShowHistory((current) => !current)}
        showHistory={showHistory}
      />

      {showHistory ? (
        <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
          <h3 className="text-base font-semibold">
            <TranslatedText translationKey="followUp.history.title" as="span" />
          </h3>
          <FollowUpHistoryTable history={history} />
        </section>
      ) : null}

      <FollowUpModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialFollowUp={active}
        onSubmit={handleSave}
        isLoading={isSaving}
        errorMessage={actionError}
      />

      <FollowUpCompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onConfirm={handleComplete}
        isLoading={isSaving}
        errorMessage={actionError}
      />

      <FollowUpCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isLoading={isSaving}
        errorMessage={actionError}
      />
    </div>
  );
}
