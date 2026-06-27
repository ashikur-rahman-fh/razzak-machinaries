import type { Language } from '@razzak-machinaries/shared/i18n';
import { isApiError } from '@razzak-machinaries/shared/api';

export function getFollowUpErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error)) {
    const code = error.code;
    if (code === 'INVALID_FOLLOW_UP_DATE') {
      return language === 'bn'
        ? 'ফলো আপের তারিখ আজ বা ভবিষ্যতের হতে হবে।'
        : 'Follow-up date must be today or a future date.';
    }
    if (code === 'ARCHIVED_CUSTOMER_FOLLOW_UP') {
      return language === 'bn'
        ? 'আর্কাইভ করা গ্রাহকদের জন্য ফলো আপ উপলব্ধ নয়।'
        : 'Follow-ups cannot be created or updated for archived customers.';
    }
    if (code === 'FOLLOW_UP_NOT_ACTIONABLE') {
      return language === 'bn'
        ? 'এই ফলো আপের বর্তমান অবস্থায় পরিবর্তন করা যাবে না।'
        : 'This follow-up cannot be updated in its current state.';
    }
  }

  return language === 'bn'
    ? 'ফলো আপ সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'
    : 'Could not save follow-up. Please try again.';
}
