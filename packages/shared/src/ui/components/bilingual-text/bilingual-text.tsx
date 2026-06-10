'use client';

import { getBilingualDisplay } from '../../../i18n/localization-utils';
import type { BilingualTextValue, DisplayMode, Language } from '../../../i18n/types';
import { cn } from '../../utils/cn';

export type BilingualTextLayout = 'default' | 'compact' | 'inline';

export type BilingualTextProps = {
  value?: BilingualTextValue;
  en?: string | null;
  bn?: string | null;
  mode?: DisplayMode;
  language?: Language;
  layout?: BilingualTextLayout;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  fallback?: string;
  as?: 'span' | 'p' | 'div';
};

const layoutRootClasses: Record<BilingualTextLayout, string> = {
  default: 'flex flex-col items-start gap-0.5',
  compact: 'inline-flex flex-col items-center gap-0.5 text-center',
  inline: 'inline-flex flex-col items-center gap-0.5 text-center leading-snug',
};

const layoutPrimaryClasses: Record<BilingualTextLayout, string> = {
  default: '',
  compact: 'text-sm leading-snug',
  inline: '',
};

const layoutSecondaryClasses: Record<BilingualTextLayout, string> = {
  default: '',
  compact: 'mt-0 text-[0.75rem] leading-snug',
  inline: 'mt-0 text-[0.8125rem] leading-snug',
};

export function BilingualText({
  value,
  en,
  bn,
  mode = 'en',
  language = 'en',
  layout = 'default',
  className,
  primaryClassName,
  secondaryClassName,
  fallback = '',
  as: Component = 'div',
}: BilingualTextProps) {
  const bilingualValue: BilingualTextValue = value ?? { en, bn };
  const display = getBilingualDisplay(bilingualValue, mode, { primaryLanguage: language });

  if (!display.primary) {
    if (!fallback) {
      return null;
    }
    return (
      <Component className={className}>
        <span className={cn('lang-en', primaryClassName)} lang="en">
          {fallback}
        </span>
      </Component>
    );
  }

  if (!display.secondary) {
    const langClass = display.primary.lang === 'bn' ? 'lang-bn' : 'lang-en';
    return (
      <Component className={className}>
        <span
          className={cn(langClass, layoutPrimaryClasses[layout], primaryClassName)}
          lang={display.primary.lang}
        >
          {display.primary.text}
        </span>
      </Component>
    );
  }

  const primaryLangClass = display.primary.lang === 'bn' ? 'lang-bn' : 'lang-en';
  const secondaryLangClass = display.secondary.lang === 'bn' ? 'lang-bn' : 'lang-en';

  return (
    <Component className={cn('bilingual-text', layoutRootClasses[layout], className)}>
      <span
        className={cn(primaryLangClass, layoutPrimaryClasses[layout], primaryClassName)}
        lang={display.primary.lang}
      >
        {display.primary.text}
      </span>
      <span
        className={cn(
          'bilingual-secondary',
          secondaryLangClass,
          layoutSecondaryClasses[layout],
          secondaryClassName,
        )}
        lang={display.secondary.lang}
      >
        {display.secondary.text}
      </span>
    </Component>
  );
}
