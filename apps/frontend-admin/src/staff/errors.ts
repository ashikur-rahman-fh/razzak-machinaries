import { getUserFacingMessage, isApiError, type ApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

export function getStaffErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error)) {
    if (error.code === 'WEAK_PASSWORD') {
      return language === 'bn'
        ? 'অনুগ্রহ করে আরও শক্তিশালী পাসওয়ার্ড বেছে নিন।'
        : 'Please choose a stronger password.';
    }
    if (error.isForbidden) {
      return language === 'bn'
        ? 'এই কাজের অনুমতি আপনার নেই।'
        : 'You do not have permission to perform this action.';
    }
  }
  return getUserFacingMessage(error as ApiError, language);
}
