'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { BilingualText } from '@razzak-machinaries/shared/ui';

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

type PaginationSummaryProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  typeTranslationKey: string;
};

export function PaginationSummary({
  page,
  pageSize,
  totalCount,
  typeTranslationKey,
}: PaginationSummaryProps) {
  const { displayMode, language, tPair } = useLanguagePreference();
  const typeLabels = tPair(typeTranslationKey);

  const typeEn = (typeLabels.en ?? '').toLowerCase();
  const typeBn = typeLabels.bn ?? '';

  let summaryEn: string;
  let summaryBn: string;

  if (totalCount === 0) {
    const emptyTemplate = tPair('geo.pagination.summaryEmpty');
    summaryEn = interpolate(emptyTemplate.en ?? '', { type: typeEn });
    summaryBn = interpolate(emptyTemplate.bn ?? '', { type: typeBn });
  } else {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalCount);
    const template = tPair('geo.pagination.summary');
    const values = {
      start: start.toLocaleString(),
      end: end.toLocaleString(),
      total: totalCount.toLocaleString(),
      type: typeEn,
    };
    const valuesBn = {
      start: start.toLocaleString(),
      end: end.toLocaleString(),
      total: totalCount.toLocaleString(),
      type: typeBn,
    };
    summaryEn = interpolate(template.en ?? '', values);
    summaryBn = interpolate(template.bn ?? '', valuesBn);
  }

  return (
    <BilingualText en={summaryEn} bn={summaryBn} mode={displayMode} language={language} as="span" />
  );
}
