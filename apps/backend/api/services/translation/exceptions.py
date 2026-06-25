from rest_framework import status
from rest_framework.exceptions import APIException

TRANSLATION_FAILED_CODE = "TRANSLATION_FAILED"
TRANSLATION_FAILED_MESSAGE = (
    "Translation is temporarily unavailable. Please enter the English text manually."
)


class TranslationFailed(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_code = TRANSLATION_FAILED_CODE
    default_detail = TRANSLATION_FAILED_MESSAGE
