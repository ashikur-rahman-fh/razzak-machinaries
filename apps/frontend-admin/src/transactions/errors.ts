import { getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

export function getTransactionCreateErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error)) {
    return getUserFacingMessage(error, language);
  }
  return language === 'bn'
    ? 'লেনদেন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'
    : 'Could not save the transaction. Please try again.';
}
