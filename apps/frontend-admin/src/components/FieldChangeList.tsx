'use client';

import { TranslatedText } from '@razzak-machinaries/shared/ui';

import { FieldDiffViewer, type FieldDiffViewMode } from './FieldDiffViewer';
import type { FieldChange } from './version-change-types';

type FieldChangeListProps = {
  changes: FieldChange[];
  emptyMessageKey?: string;
  className?: string;
  viewMode?: FieldDiffViewMode;
  beforeTitleKey?: string;
  afterTitleKey?: string;
};

export function FieldChangeList({
  changes,
  emptyMessageKey,
  className,
  viewMode = 'unified',
  beforeTitleKey,
  afterTitleKey,
}: FieldChangeListProps) {
  if (changes.length === 0) {
    if (!emptyMessageKey) {
      return null;
    }
    return (
      <p className={`text-sm text-muted-foreground ${className ?? ''}`.trim()}>
        <TranslatedText translationKey={emptyMessageKey} as="span" layout="inline" />
      </p>
    );
  }

  const beforeTitle =
    viewMode === 'split' && beforeTitleKey ? (
      <TranslatedText translationKey={beforeTitleKey} as="span" layout="inline" compact />
    ) : undefined;
  const afterTitle =
    viewMode === 'split' && afterTitleKey ? (
      <TranslatedText translationKey={afterTitleKey} as="span" layout="inline" compact />
    ) : undefined;

  return (
    <ul className={`space-y-3 text-sm ${className ?? ''}`.trim()}>
      {changes.map((change, index) => (
        <li
          key={`${change.labelKey}-${index}`}
          className="space-y-2 rounded-md border bg-muted/30 px-3 py-2"
          data-testid="field-change-item"
        >
          <p className="font-medium">
            <TranslatedText translationKey={change.labelKey} as="span" layout="inline" compact />
          </p>
          <FieldDiffViewer
            from={change.from}
            to={change.to}
            isBangla={change.isBanglaFrom || change.isBanglaTo}
            viewMode={viewMode}
            beforeTitle={beforeTitle}
            afterTitle={afterTitle}
          />
        </li>
      ))}
    </ul>
  );
}
