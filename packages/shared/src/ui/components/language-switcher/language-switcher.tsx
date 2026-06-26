'use client';

import type { DisplayMode, Language } from '../../../i18n/types';
import { cn } from '../../utils/cn';

export type LanguageSwitcherLabels = {
  english: string;
  bangla: string;
  both: string;
  selectLanguage: string;
};

export type LanguageSwitcherProps = {
  language: Language;
  displayMode: DisplayMode;
  onSelectEnglish: () => void;
  onSelectBangla: () => void;
  onSelectBoth: () => void;
  labels: LanguageSwitcherLabels;
  className?: string;
};

type SwitcherOption = {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
};

export function LanguageSwitcher({
  language,
  displayMode,
  onSelectEnglish,
  onSelectBangla,
  onSelectBoth,
  labels,
  className,
}: LanguageSwitcherProps) {
  const options: SwitcherOption[] = [
    {
      id: 'en',
      label: labels.english,
      isActive: language === 'en' && displayMode === 'en',
      onSelect: onSelectEnglish,
    },
    {
      id: 'bn',
      label: labels.bangla,
      isActive: language === 'bn' && displayMode === 'bn',
      onSelect: onSelectBangla,
    },
    {
      id: 'both',
      label: labels.both,
      isActive: displayMode === 'both',
      onSelect: onSelectBoth,
    },
  ];

  return (
    <div
      role="group"
      aria-label={labels.selectLanguage}
      className={cn(
        'flex w-full items-center rounded-md border border-border bg-muted/40 p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.isActive}
          lang={option.id === 'en' ? 'en' : option.id === 'bn' ? 'bn' : undefined}
          onClick={option.onSelect}
          className={cn(
            'flex min-w-0 flex-1 cursor-pointer justify-center rounded-[calc(var(--radius-sm)-1px)] px-2 py-1 text-center text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            option.isActive
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            option.id === 'bn' && 'lang-bn',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
