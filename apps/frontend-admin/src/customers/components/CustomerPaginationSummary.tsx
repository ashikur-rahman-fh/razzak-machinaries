'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText } from '@razzak-machinaries/shared/ui';

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

type CustomerPaginationSummaryProps = {
  page: number;
  pageSize: number;
  totalCount: number;
};

export function CustomerPaginationSummary({
  page,
  pageSize,
  totalCount,
}: CustomerPaginationSummaryProps) {
  const { displayMode, language, tPair } = useLanguagePreference();

  let summaryEn: string;
  let summaryBn: string;

  if (totalCount === 0) {
    const emptyTemplate = tPair('customer.pagination.summaryEmpty');
    summaryEn = emptyTemplate.en ?? '';
    summaryBn = emptyTemplate.bn ?? '';
  } else {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalCount);
    const template = tPair('customer.pagination.summary');
    summaryEn = interpolate(template.en ?? '', {
      start: start.toLocaleString(),
      end: end.toLocaleString(),
      total: totalCount.toLocaleString(),
    });
    summaryBn = interpolate(template.bn ?? '', {
      start: start.toLocaleString(),
      end: end.toLocaleString(),
      total: totalCount.toLocaleString(),
    });
  }

  return (
    <BilingualText en={summaryEn} bn={summaryBn} mode={displayMode} language={language} as="span" />
  );
}
