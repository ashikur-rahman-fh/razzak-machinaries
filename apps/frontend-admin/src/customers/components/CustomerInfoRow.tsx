'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText, TranslatedText } from '@razzak-machinaries/shared/ui';
import type { ReactNode } from 'react';

type CustomerInfoRowProps = {
  labelKey: string;
  valueBn?: string;
  valueEn?: string;
  value?: string;
  emptyKey?: string;
  children?: ReactNode;
};

export function CustomerInfoRow({
  labelKey,
  valueBn,
  valueEn,
  value,
  emptyKey = 'customer.detail.notProvided',
  children,
}: CustomerInfoRowProps) {
  const { displayMode, language } = useLanguagePreference();
  const hasBilingual = valueBn !== undefined || valueEn !== undefined;
  const hasPlain = value !== undefined && value.trim() !== '';
  const hasBilingualContent = Boolean(valueBn?.trim() || valueEn?.trim());
  const isEmpty = children === undefined && !hasPlain && !hasBilingualContent;

  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <TranslatedText translationKey={labelKey} as="span" layout="inline" />
      </dt>
      <dd className="text-sm">
        {children}
        {!children && hasBilingual && hasBilingualContent ? (
          <BilingualText
            bn={valueBn ?? ''}
            en={valueEn ?? ''}
            mode={displayMode}
            language={language}
            layout="default"
            as="span"
          />
        ) : null}
        {!children && !hasBilingual && hasPlain ? <span>{value}</span> : null}
        {isEmpty ? (
          <span className="text-muted-foreground">
            <TranslatedText translationKey={emptyKey} as="span" layout="inline" />
          </span>
        ) : null}
      </dd>
    </div>
  );
}
