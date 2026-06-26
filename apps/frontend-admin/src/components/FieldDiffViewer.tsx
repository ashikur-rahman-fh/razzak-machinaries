'use client';

import type { ReactElement } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

import { getFieldDiffStyles } from './field-diff-styles';

export type FieldDiffViewMode = 'unified' | 'split';

type FieldDiffViewerProps = {
  from: string;
  to: string;
  isBangla?: boolean;
  viewMode: FieldDiffViewMode;
  beforeTitle?: ReactElement;
  afterTitle?: ReactElement;
};

export function normalizeDiffValue(value: string): string {
  if (value.includes(';')) {
    return value.replace(/;\s*/g, '\n');
  }
  return value;
}

export function FieldDiffViewer({
  from,
  to,
  isBangla = false,
  viewMode,
  beforeTitle,
  afterTitle,
}: FieldDiffViewerProps) {
  const isSplit = viewMode === 'split';

  return (
    <div className="overflow-x-auto" data-testid="field-diff-viewer" data-view-mode={viewMode}>
      <ReactDiffViewer
        oldValue={normalizeDiffValue(from)}
        newValue={normalizeDiffValue(to)}
        splitView={isSplit}
        compareMethod={DiffMethod.WORDS_WITH_SPACE}
        hideLineNumbers
        hideSummary
        showDiffOnly={false}
        extraLinesSurroundingDiff={0}
        disableWorker
        styles={getFieldDiffStyles(isBangla)}
        leftTitle={isSplit ? beforeTitle : undefined}
        rightTitle={isSplit ? afterTitle : undefined}
      />
    </div>
  );
}
