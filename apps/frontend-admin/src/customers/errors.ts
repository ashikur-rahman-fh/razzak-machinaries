import { getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

function getCustomerValidationErrorMessage(error: unknown): string | null {
  if (isApiError(error) && error.isValidationError && error.details) {
    const detailValues = Object.values(error.details).filter(Boolean);
    if (detailValues.length > 0) {
      return detailValues.join(' ');
    }
  }
  return null;
}

export function getCustomerCreateErrorMessage(error: unknown, language: Language): string {
  return getCustomerValidationErrorMessage(error) ?? getUserFacingMessage(error, language);
}

export function getCustomerUpdateErrorMessage(error: unknown, language: Language): string {
  return getCustomerValidationErrorMessage(error) ?? getUserFacingMessage(error, language);
}

export function getCustomerArchiveErrorMessage(error: unknown, language: Language): string {
  return getUserFacingMessage(error, language);
}
