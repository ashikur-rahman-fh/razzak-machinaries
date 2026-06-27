'use client';

import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';

type HalkhataPaginationSummaryProps = {
  page: number;
  pageSize: number;
  totalCount: number;
};

export function HalkhataPaginationSummary({
  page,
  pageSize,
  totalCount,
}: HalkhataPaginationSummaryProps) {
  const { language } = useLanguagePreference();
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  if (language === 'bn') {
    return (
      <span>
        {totalCount}টির মধ্যে {start}–{end} দেখানো হচ্ছে
      </span>
    );
  }

  return (
    <span>
      Showing {start}–{end} of {totalCount}
    </span>
  );
}
