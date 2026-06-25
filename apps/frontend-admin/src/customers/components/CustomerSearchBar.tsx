'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import { Button, Input, TranslatedText } from '@razzak-machinaries/shared/ui';

type CustomerSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function CustomerSearchBar({ value, onChange, onClear, disabled }: CustomerSearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex-1">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('customer.search.placeholder')}
        disabled={disabled}
        aria-label={t('customer.search.placeholder')}
        data-testid="customer-search-input"
        className="pr-10"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-2 text-xs"
          onClick={onClear}
          disabled={disabled}
          data-testid="customer-search-clear"
        >
          <TranslatedText translationKey="customer.actions.clearSearch" as="span" compact />
        </Button>
      ) : null}
    </div>
  );
}
