'use client';

import type { CustomerFollowUp } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { Button, TranslatedText } from '@razzak-machinaries/shared/ui';

import { formatCalendarDate } from '@/follow-ups/date-utils';
import { FollowUpStatusBadge } from '@/follow-ups/components/FollowUpStatusBadge';

type FollowUpCardProps = {
  active: CustomerFollowUp | null;
  isArchived: boolean;
  onSetFollowUp: () => void;
  onReschedule: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
};

function TimingBadge({ followUp }: { followUp: CustomerFollowUp }) {
  if (followUp.status !== 'pending') return null;

  if (followUp.isOverdue) {
    return (
      <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800">
        <TranslatedText translationKey="followUp.badge.overdue" as="span" compact />
      </span>
    );
  }

  if (followUp.isToday) {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <TranslatedText translationKey="followUp.badge.today" as="span" compact />
      </span>
    );
  }

  return null;
}

function InfoRow({ labelKey, value }: { labelKey: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <TranslatedText translationKey={labelKey} as="span" />
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function FollowUpCard({
  active,
  isArchived,
  onSetFollowUp,
  onReschedule,
  onComplete,
  onCancel,
  onToggleHistory,
  showHistory,
}: FollowUpCardProps) {
  const { language } = useLanguagePreference();

  return (
    <section
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-6"
      data-testid="follow-up-card"
    >
      <h2 className="text-base font-semibold">
        <TranslatedText translationKey="followUp.title" as="span" />
      </h2>

      <div className="space-y-4">
        {isArchived ? (
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="followUp.archivedDisabled" as="span" />
          </p>
        ) : null}

        {active ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <FollowUpStatusBadge status={active.status} />
              <TimingBadge followUp={active} />
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                labelKey="followUp.date"
                value={formatCalendarDate(active.followUpDate, language)}
              />
              <InfoRow labelKey="followUp.assignedTo" value={active.assignedToName ?? '—'} />
              <InfoRow labelKey="followUp.createdBy" value={active.createdByName ?? '—'} />
              <InfoRow labelKey="followUp.note" value={active.note || '—'} />
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <TranslatedText translationKey="followUp.noActive" as="span" />
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!isArchived ? (
            active ? (
              <>
                <Button variant="outline" size="sm" onClick={onReschedule}>
                  <TranslatedText translationKey="followUp.actions.reschedule" as="span" compact />
                </Button>
                <Button variant="outline" size="sm" onClick={onComplete}>
                  <TranslatedText translationKey="followUp.actions.complete" as="span" compact />
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <TranslatedText translationKey="followUp.actions.cancel" as="span" compact />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onSetFollowUp}>
                <TranslatedText translationKey="followUp.actions.set" as="span" compact />
              </Button>
            )
          ) : null}
          <Button variant="ghost" size="sm" onClick={onToggleHistory}>
            <TranslatedText
              translationKey={
                showHistory ? 'followUp.actions.hideHistory' : 'followUp.actions.viewHistory'
              }
              as="span"
              compact
            />
          </Button>
        </div>
      </div>
    </section>
  );
}
