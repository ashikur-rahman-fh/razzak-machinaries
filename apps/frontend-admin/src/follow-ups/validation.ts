import { isCalendarDateBefore, todayIsoDateLocal } from './date-utils';

export type FollowUpFormValues = {
  followUpDate: string;
  note: string;
};

export type FollowUpFormErrors = Partial<Record<keyof FollowUpFormValues, string>>;

export function validateFollowUpForm(
  values: FollowUpFormValues,
  language: 'en' | 'bn',
): FollowUpFormErrors {
  const errors: FollowUpFormErrors = {};

  if (!values.followUpDate.trim()) {
    errors.followUpDate =
      language === 'bn' ? 'ফলো আপের তারিখ প্রয়োজন।' : 'Follow-up date is required.';
    return errors;
  }

  if (isCalendarDateBefore(values.followUpDate, todayIsoDateLocal())) {
    errors.followUpDate =
      language === 'bn'
        ? 'ফলো আপের তারিখ আজ বা ভবিষ্যতের হতে হবে।'
        : 'Follow-up date must be today or a future date.';
  }

  return errors;
}

export function defaultFollowUpDate(): string {
  return todayIsoDateLocal();
}
