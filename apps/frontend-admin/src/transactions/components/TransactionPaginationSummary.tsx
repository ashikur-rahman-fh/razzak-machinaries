'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText } from '@razzak-machinaries/shared/ui';

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

type TransactionPaginationSummaryProps = {
  page: number;
  pageSize: number;
  totalCount: number;
};

export function TransactionPaginationSummary({
  page,
  pageSize,
  totalCount,
}: TransactionPaginationSummaryProps) {
  const { displayMode, language, tPair } = useLanguagePreference();

  if (totalCount === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const template = tPair('transaction.pagination.summary');
  const summaryEn = interpolate(template.en ?? '', {
    start: start.toLocaleString(),
    end: end.toLocaleString(),
    total: totalCount.toLocaleString(),
  });
  const summaryBn = interpolate(template.bn ?? '', {
    start: start.toLocaleString(),
    end: end.toLocaleString(),
    total: totalCount.toLocaleString(),
  });

  return (
    <BilingualText en={summaryEn} bn={summaryBn} mode={displayMode} language={language} as="span" />
  );
}
