'use client';

import type { TransactionType } from '@razzak-machinaries/shared/api';
import { useTranslation } from '@razzak-machinaries/shared/i18n';
import { Badge, TranslatedText } from '@razzak-machinaries/shared/ui';

import { TRANSACTION_TYPE_LABEL_KEYS } from '../constants';

type TransactionTypeBadgeProps = {
  type: TransactionType;
};

const VARIANTS: Record<TransactionType, 'default' | 'secondary' | 'success' | 'warning'> = {
  INITIAL: 'secondary',
  SALE: 'warning',
  PAYMENT: 'success',
};

export function TransactionTypeBadge({ type }: TransactionTypeBadgeProps) {
  const { t } = useTranslation();
  return <Badge variant={VARIANTS[type]}>{t(TRANSACTION_TYPE_LABEL_KEYS[type])}</Badge>;
}

export function TransactionTypeLabel({ type }: TransactionTypeBadgeProps) {
  return <TranslatedText translationKey={TRANSACTION_TYPE_LABEL_KEYS[type]} as="span" compact />;
}
