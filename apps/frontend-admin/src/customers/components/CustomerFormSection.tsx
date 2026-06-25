'use client';

import { TranslatedText } from '@razzak-machinaries/shared/ui';
import type { ReactNode } from 'react';

type CustomerFormSectionProps = {
  titleKey: string;
  children: ReactNode;
  optional?: boolean;
};

export function CustomerFormSection({
  titleKey,
  children,
  optional = false,
}: CustomerFormSectionProps) {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/60 pb-4">
        <h2 className="text-base font-semibold leading-snug">
          <TranslatedText translationKey={titleKey} as="span" />
        </h2>
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">
            <TranslatedText translationKey="customer.field.optional" as="span" compact />
          </span>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
