'use client';

import { type DashboardFollowUpItem, adminFollowUpsApi } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  BilingualText,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
  cn,
} from '@razzak-machinaries/shared/ui';
import Link from 'next/link';
import { useState } from 'react';

import { buildDetailUrl } from '@/customers/routes';
import { FollowUpCompleteDialog } from '@/follow-ups/components/FollowUpActionDialogs';
import { FollowUpModal } from '@/follow-ups/components/FollowUpModal';
import { getFollowUpErrorMessage } from '@/follow-ups/errors';
import { getAsyncData, isAsyncInitialLoad, useDashboardFollowUps } from '@/follow-ups/hooks';
import type { FollowUpFormValues } from '@/follow-ups/validation';

import { formatCalendarDate } from '@/follow-ups/date-utils';

type DashboardFollowUpsProps = {
  onActionComplete?: () => void;
};

export function DashboardFollowUps({ onActionComplete }: DashboardFollowUpsProps) {
  const { language, displayMode } = useLanguagePreference();
  const { state, reload } = useDashboardFollowUps();
  const data = getAsyncData(state);
  const isInitialLoad = isAsyncInitialLoad(state);
  const items = data?.items ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'reschedule'>('reschedule');
  const [selectedItem, setSelectedItem] = useState<DashboardFollowUpItem | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function openReschedule(item: DashboardFollowUpItem) {
    setSelectedItem(item);
    setModalMode('reschedule');
    setActionError(null);
    setModalOpen(true);
  }

  function openComplete(item: DashboardFollowUpItem) {
    setSelectedItem(item);
    setActionError(null);
    setCompleteOpen(true);
  }

  async function handleReschedule(values: FollowUpFormValues) {
    if (!selectedItem) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await adminFollowUpsApi.updateFollowUp(selectedItem.id, {
        followUpDate: values.followUpDate,
        note: values.note,
      });
      setModalOpen(false);
      await reload();
      onActionComplete?.();
    } catch (error) {
      setActionError(getFollowUpErrorMessage(error, language));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete(completionNote: string) {
    if (!selectedItem) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await adminFollowUpsApi.completeFollowUp(selectedItem.id, { completionNote });
      setCompleteOpen(false);
      await reload();
      onActionComplete?.();
    } catch (error) {
      setActionError(getFollowUpErrorMessage(error, language));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card data-testid="dashboard-follow-ups">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            <TranslatedText translationKey="dashboard.followUps.title" as="span" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="dashboard.followUps.subtitle" as="span" />
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isInitialLoad ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">…</div>
          ) : items.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                title={
                  <TranslatedText
                    translationKey="dashboard.followUps.empty"
                    as="span"
                    layout="inline"
                  />
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <TranslatedText
                        translationKey="dashboard.column.customer"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead>
                      <TranslatedText
                        translationKey="dashboard.followUps.column.phone"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead>
                      <TranslatedText translationKey="dashboard.column.address" as="span" compact />
                    </TableHead>
                    <TableHead>
                      <TranslatedText
                        translationKey="dashboard.column.currentDue"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead>
                      <TranslatedText
                        translationKey="dashboard.followUps.column.followUpDate"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead>
                      <TranslatedText
                        translationKey="dashboard.followUps.column.note"
                        as="span"
                        compact
                      />
                    </TableHead>
                    <TableHead className="text-right">
                      <TranslatedText translationKey="dashboard.column.actions" as="span" compact />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} data-testid={`dashboard-follow-up-row-${item.id}`}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <BilingualText
                            bn={item.customer.fullNameBn}
                            en={item.customer.fullNameEn}
                            language={language}
                            mode={displayMode}
                          />
                          {item.isOverdue ? (
                            <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                              <TranslatedText
                                translationKey="followUp.badge.overdue"
                                as="span"
                                compact
                              />
                            </span>
                          ) : item.isToday ? (
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                              <TranslatedText
                                translationKey="followUp.badge.today"
                                as="span"
                                compact
                              />
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.customer.phone ? (
                          <a
                            href={`tel:${item.customer.phone}`}
                            className="text-primary hover:underline"
                          >
                            {item.customer.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <BilingualText
                          bn={item.customer.addressBn}
                          en={item.customer.addressEn}
                          language={language}
                          mode={displayMode}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            Number(item.customer.currentBalance) >= 10000 &&
                              'text-amber-700 dark:text-amber-400',
                          )}
                        >
                          {formatBdt(item.customer.currentBalance, language)}
                        </span>
                      </TableCell>
                      <TableCell>{formatCalendarDate(item.followUpDate, language)}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{item.note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={buildDetailUrl(item.customer.id)}>
                              <TranslatedText
                                translationKey="dashboard.followUps.action.viewCustomer"
                                as="span"
                                compact
                              />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openComplete(item)}>
                            <TranslatedText
                              translationKey="dashboard.followUps.action.markCompleted"
                              as="span"
                              compact
                            />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openReschedule(item)}>
                            <TranslatedText
                              translationKey="dashboard.followUps.action.reschedule"
                              as="span"
                              compact
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FollowUpModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialFollowUp={
          selectedItem
            ? {
                id: selectedItem.id,
                customerId: selectedItem.customer.id,
                followUpDate: selectedItem.followUpDate,
                status: 'pending',
                note: selectedItem.note,
                completionNote: '',
                assignedToId: null,
                assignedToName: selectedItem.assignedToName,
                createdById: null,
                createdByName: selectedItem.createdByName,
                completedById: null,
                completedByName: null,
                completedAt: null,
                rescheduledFromId: null,
                createdAt: '',
                updatedAt: '',
                isOverdue: selectedItem.isOverdue,
                isToday: selectedItem.isToday,
              }
            : null
        }
        onSubmit={handleReschedule}
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
    </>
  );
}
