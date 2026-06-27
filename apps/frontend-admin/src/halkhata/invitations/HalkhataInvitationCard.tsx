'use client';

import type { HalkhataInvitationRecipientSnapshot } from '@razzak-machinaries/shared/api';
import { STORE_CONFIG } from '@razzak-machinaries/shared/constants/store';
import { BrandLogo, cn } from '@razzak-machinaries/shared/ui';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';

import { buildInvitationMessage } from './utils';

export type InvitationCardLayout = 'full' | 'half';

type HalkhataInvitationCardProps = {
  recipient: HalkhataInvitationRecipientSnapshot;
  halkhataDate: string;
  generatedAt: string;
  layout?: InvitationCardLayout;
};

function InfoRow({
  label,
  value,
  valueClassName,
  compact = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  compact?: boolean;
}) {
  if (!value || value === '—') {
    return null;
  }
  return (
    <div
      className={cn(
        'grid grid-cols-[7rem_1fr] gap-x-2 gap-y-0.5 text-sm leading-relaxed',
        'print:grid-cols-[4.5rem_1fr] print:gap-x-1.5 print:text-xs print:leading-snug',
        compact && 'print:text-[11px]',
      )}
    >
      <dt className="font-medium text-neutral-700">{label}</dt>
      <dd className={cn('text-neutral-900', valueClassName)}>{value}</dd>
    </div>
  );
}

export function HalkhataInvitationCard({
  recipient,
  halkhataDate,
  generatedAt,
  layout = 'full',
}: HalkhataInvitationCardProps) {
  const isHalf = layout === 'half';
  const message = buildInvitationMessage(recipient.customerNameSnapshot, halkhataDate);
  const generatedDateLabel = new Date(generatedAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article
      className={cn(
        'invitation-card lang-bn w-full border border-neutral-300 bg-white px-8 py-10 text-neutral-900 shadow-sm',
        'print:border-neutral-400 print:px-4 print:py-3 print:shadow-none',
        isHalf && 'invitation-card--compact print:py-2',
      )}
      aria-label={`হালখাতার দাওয়াতনামা — ${recipient.customerNameSnapshot}`}
    >
      <header
        className={cn(
          'shrink-0 border-b border-neutral-300 pb-5 text-center print:pb-2',
          isHalf && 'print:pb-1',
        )}
      >
        <div className={cn('mb-3 flex justify-center print:mb-1', isHalf && 'print:hidden')}>
          <BrandLogo size="navbar" className="h-14 print:h-8" />
        </div>
        <h1
          className={cn(
            'text-2xl font-bold tracking-tight print:text-lg',
            isHalf && 'print:text-base',
          )}
        >
          {STORE_CONFIG.invitationNameBn}
        </h1>
        <p className={cn('mt-1 text-sm text-neutral-700 print:text-xs', isHalf && 'print:hidden')}>
          {STORE_CONFIG.nameEn}
        </p>
        {STORE_CONFIG.addressBn ? (
          <p className="mt-2 text-sm text-neutral-700 print:mt-0.5 print:text-xs">
            {STORE_CONFIG.addressBn}
          </p>
        ) : null}
        {STORE_CONFIG.phone ? (
          <p className="mt-1 text-sm text-neutral-700 print:text-xs">{STORE_CONFIG.phone}</p>
        ) : null}
        <p
          className={cn(
            'mt-4 text-lg font-semibold text-neutral-900 print:mt-1 print:text-base',
            isHalf && 'print:mt-0.5 print:text-sm',
          )}
        >
          হালখাতার দাওয়াতনামা
        </p>
        <p className="mt-1 text-xs text-neutral-600 print:mt-0.5 print:text-[10px]">
          প্রস্তুতির তারিখ: {generatedDateLabel}
        </p>
      </header>

      <div className="invitation-card__body flex min-h-0 flex-1 flex-col overflow-hidden">
        <section
          className={cn(
            'mt-6 shrink-0 space-y-1 rounded-md border border-neutral-300 p-4',
            'print:mt-2 print:p-2',
            isHalf && 'print:mt-1 print:p-1.5',
          )}
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 print:gap-x-2">
            <div className="space-y-0.5">
              <InfoRow compact={isHalf} label="নাম" value={recipient.customerNameSnapshot} />
              <InfoRow compact={isHalf} label="পিতার নাম" value={recipient.fatherNameSnapshot} />
              <InfoRow compact={isHalf} label="মোবাইল" value={recipient.phoneSnapshot} />
            </div>
            <div className="space-y-0.5">
              <InfoRow
                compact={isHalf}
                label="মেমো পৃষ্ঠা"
                value={recipient.memoPageNumberSnapshot}
              />
              <InfoRow
                compact={isHalf}
                label="বর্তমান বকেয়া"
                value={formatBdt(recipient.dueAmountSnapshot, 'bn')}
              />
            </div>
          </div>
          <InfoRow
            compact={isHalf}
            label="ঠিকানা"
            value={recipient.addressSnapshot}
            valueClassName="break-words"
          />
        </section>

        <section
          className={cn(
            'mt-6 min-h-0 flex-1 overflow-hidden whitespace-pre-line text-sm leading-7 text-neutral-900',
            'print:mt-2 print:text-xs print:leading-snug',
            isHalf && 'print:mt-1',
          )}
        >
          {message}
        </section>
      </div>

      <footer
        className={cn(
          'mt-8 shrink-0 border-t border-neutral-300 pt-4 text-center text-sm text-neutral-800',
          'print:mt-2 print:pt-2 print:text-xs',
          isHalf && 'print:mt-1 print:pt-1',
        )}
      >
        <p>ধন্যবাদান্তে,</p>
        <p className="mt-1 font-semibold print:mt-0.5">{STORE_CONFIG.invitationNameBn}</p>
        {STORE_CONFIG.addressBn ? (
          <p className="mt-1 print:hidden">{STORE_CONFIG.addressBn}</p>
        ) : null}
        {STORE_CONFIG.phone ? <p className="mt-1 print:hidden">{STORE_CONFIG.phone}</p> : null}
      </footer>
    </article>
  );
}
