import { getUserFacingMessage, isApiError } from '@razzak-machinaries/shared/api';
import type { Language } from '@razzak-machinaries/shared/i18n';

function getValidationErrorMessage(error: unknown): string | null {
  if (isApiError(error) && error.isValidationError && error.details) {
    const detailValues = Object.values(error.details).filter(Boolean);
    if (detailValues.length > 0) {
      return detailValues.join(' ');
    }
  }
  return null;
}

export function getHalkhataErrorMessage(error: unknown, language: Language): string {
  return getValidationErrorMessage(error) ?? getUserFacingMessage(error, language);
}
