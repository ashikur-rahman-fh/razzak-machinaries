import { getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

export function getCustomerCreateErrorMessage(error: unknown, language: Language): string {
  if (isApiError(error) && error.isValidationError && error.details) {
    const detailValues = Object.values(error.details).filter(Boolean);
    if (detailValues.length > 0) {
      return detailValues.join(' ');
    }
  }
  return getUserFacingMessage(error, language);
}
