import { getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

const CHILD_TYPE_LABELS: Record<string, Record<Language, string>> = {
  district: { en: 'districts', bn: 'জেলা' },
  upazila: { en: 'upazilas', bn: 'উপজেলা' },
  union: { en: 'unions', bn: 'ইউনিয়ন' },
};

export function getGeoDeleteErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error) && error.code === 'GEO_HAS_CHILDREN') {
    const details = error.details as { childType?: string } | undefined;
    const childType = typeof details?.childType === 'string' ? details.childType : 'child';
    const childLabel = CHILD_TYPE_LABELS[childType]?.[language] ?? childType;
    if (language === 'bn') {
      return `এই অঞ্চল মুছে ফেলা যাবে না কারণ এর সাথে ${childLabel} সংযুক্ত আছে।`;
    }
    return `This area cannot be deleted because it has ${childLabel} linked to it.`;
  }
  return getUserFacingMessage(error, language);
}

export function getGeoUpdateErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error) && error.isValidationError && error.details) {
    const detailValues = Object.values(error.details).filter(Boolean);
    if (detailValues.length > 0) {
      return detailValues.join(' ');
    }
  }
  return getUserFacingMessage(error, language);
}
