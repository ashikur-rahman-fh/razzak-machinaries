'use client';

import { useLanguagePreference } from '../../../i18n/LanguageProvider';
import { BilingualText, type BilingualTextLayout } from '../bilingual-text/bilingual-text';

export type TranslatedTextProps = {
  translationKey: string;
  as?: 'span' | 'p' | 'div';
  className?: string;
  compact?: boolean;
  layout?: BilingualTextLayout;
};

export function TranslatedText({
  translationKey,
  as = 'span',
  className,
  compact = false,
  layout,
}: TranslatedTextProps) {
  const { displayMode, language, tPair } = useLanguagePreference();
  const value = tPair(translationKey);
  const resolvedLayout = layout ?? (compact ? 'compact' : 'default');

  return (
    <BilingualText
      value={value}
      mode={displayMode}
      language={language}
      layout={resolvedLayout}
      as={as}
      className={className}
    />
  );
}
