'use client';

import { ConfirmDialog, TranslatedText } from '@razzak-machinaries/shared/ui';

import type { FieldChange } from '../validation';

type ConfirmUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: FieldChange[];
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  titleKey?: string;
  messageKey?: string;
};

export function ConfirmUpdateModal({
  open,
  onOpenChange,
  changes,
  onConfirm,
  isLoading = false,
  titleKey = 'geo.update.title',
  messageKey = 'geo.update.message',
}: ConfirmUpdateModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={<TranslatedText translationKey={titleKey} as="span" layout="inline" />}
      description={
        <>
          <p>
            <TranslatedText translationKey={messageKey} as="span" layout="inline" />
          </p>
          {changes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {changes.map((change) => (
                <li key={change.labelKey}>
                  <TranslatedText
                    translationKey={change.labelKey}
                    as="span"
                    layout="inline"
                    compact
                  />
                  {': '}
                  &ldquo;{change.from}&rdquo; → &ldquo;{change.to}&rdquo;
                </li>
              ))}
            </ul>
          ) : null}
        </>
      }
      cancelLabel={<TranslatedText translationKey="geo.actions.cancel" as="span" compact />}
      confirmLabel={
        isLoading ? (
          <TranslatedText translationKey="geo.update.updating" as="span" compact />
        ) : (
          <TranslatedText translationKey="geo.update.confirm" as="span" compact />
        )
      }
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
