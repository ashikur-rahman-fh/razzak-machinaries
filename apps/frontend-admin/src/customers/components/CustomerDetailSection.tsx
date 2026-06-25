'use client';

import { TranslatedText } from '@razzak-machinaries/shared/ui';
import type { ReactNode } from 'react';

type CustomerDetailSectionProps = {
  titleKey: string;
  children: ReactNode;
  optional?: boolean;
};

export function CustomerDetailSection({
  titleKey,
  children,
  optional = false,
}: CustomerDetailSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">
          <TranslatedText translationKey={titleKey} as="span" layout="inline" />
        </h2>
        {optional ? (
          <span className="text-xs text-muted-foreground">
            (<TranslatedText translationKey="customer.field.optional" as="span" layout="inline" />)
          </span>
        ) : null}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}
