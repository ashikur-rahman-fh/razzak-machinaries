import logging

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.views import exception_handler

from api.admin.constants import (
    ADMIN_FORBIDDEN_CODE,
    ADMIN_FORBIDDEN_MESSAGE,
    INVALID_CREDENTIALS_CODE,
    INVALID_CREDENTIALS_MESSAGE,
    INVALID_CURRENT_PASSWORD_CODE,
    INVALID_CURRENT_PASSWORD_MESSAGE,
    WEAK_PASSWORD_CODE,
    WEAK_PASSWORD_MESSAGE,
)
from api.admin.exceptions import (
    AdminForbidden,
    AdminUnauthenticated,
    InvalidAdminCredentials,
)
from api.services.translation.exceptions import (
    TRANSLATION_FAILED_CODE,
    TRANSLATION_FAILED_MESSAGE,
)
from geo.exceptions import (
    GEO_HAS_CHILDREN_CODE,
    GEO_HAS_CHILDREN_MESSAGE,
    GEO_ID_CONFLICT_CODE,
    GEO_ID_CONFLICT_MESSAGE,
)
from transactions.exceptions import (
    INVALID_SALE_ITEM_QUANTITY_MESSAGE,
    INVALID_SALE_ITEM_UNIT_PRICE_MESSAGE,
    INVALID_SALE_ITEMS_MESSAGE,
    INVALID_TRANSACTION_AMOUNT_MESSAGE,
    InvalidSaleItemQuantity,
    InvalidSaleItems,
    InvalidSaleItemUnitPrice,
    InvalidTransactionAmount,
)

logger = logging.getLogger(__name__)

SAFE_MESSAGES = {
    "NOT_FOUND": "We could not find the requested resource.",
    "METHOD_NOT_ALLOWED": "This action is not supported.",
    "VALIDATION_ERROR": "Please check your input and try again.",
    "INTERNAL_SERVER_ERROR": "The server had a problem. Please try again later.",
    "API_ERROR": "Something went wrong. Please try again.",
    INVALID_CREDENTIALS_CODE: INVALID_CREDENTIALS_MESSAGE,
    ADMIN_FORBIDDEN_CODE: ADMIN_FORBIDDEN_MESSAGE,
    "UNAUTHORIZED": "You need to sign in to continue.",
    INVALID_CURRENT_PASSWORD_CODE: INVALID_CURRENT_PASSWORD_MESSAGE,
    WEAK_PASSWORD_CODE: WEAK_PASSWORD_MESSAGE,
    GEO_HAS_CHILDREN_CODE: GEO_HAS_CHILDREN_MESSAGE,
    GEO_ID_CONFLICT_CODE: GEO_ID_CONFLICT_MESSAGE,
    TRANSLATION_FAILED_CODE: TRANSLATION_FAILED_MESSAGE,
    InvalidTransactionAmount.default_code: INVALID_TRANSACTION_AMOUNT_MESSAGE,
    InvalidSaleItems.default_code: INVALID_SALE_ITEMS_MESSAGE,
    InvalidSaleItemQuantity.default_code: INVALID_SALE_ITEM_QUANTITY_MESSAGE,
    InvalidSaleItemUnitPrice.default_code: INVALID_SALE_ITEM_UNIT_PRICE_MESSAGE,
}


def _error_payload(code: str, message: str, details=None) -> dict:
    if details is None:
        details = {}
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }


def _code_and_message(exc: APIException, status_code: int) -> tuple[str, str]:
    if isinstance(exc, (AdminUnauthenticated, NotAuthenticated)):
        return "UNAUTHORIZED", SAFE_MESSAGES["UNAUTHORIZED"]
    if isinstance(exc, (InvalidAdminCredentials, AuthenticationFailed)):
        return INVALID_CREDENTIALS_CODE, INVALID_CREDENTIALS_MESSAGE
    if isinstance(exc, (AdminForbidden, PermissionDenied)):
        return ADMIN_FORBIDDEN_CODE, ADMIN_FORBIDDEN_MESSAGE
    if isinstance(exc, NotFound):
        return "NOT_FOUND", SAFE_MESSAGES["NOT_FOUND"]
    if isinstance(exc, MethodNotAllowed):
        return "METHOD_NOT_ALLOWED", SAFE_MESSAGES["METHOD_NOT_ALLOWED"]
    if isinstance(exc, ValidationError):
        return "VALIDATION_ERROR", SAFE_MESSAGES["VALIDATION_ERROR"]
    if hasattr(exc, "default_code") and exc.default_code in SAFE_MESSAGES:
        return exc.default_code, SAFE_MESSAGES[exc.default_code]
    if status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        return "INTERNAL_SERVER_ERROR", SAFE_MESSAGES["INTERNAL_SERVER_ERROR"]
    return "API_ERROR", SAFE_MESSAGES["API_ERROR"]


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    status_code = response.status_code
    if status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        logger.exception("Unhandled API exception", exc_info=exc)

    if isinstance(exc, APIException):
        code, message = _code_and_message(exc, status_code)
        if isinstance(exc, ValidationError):
            details = response.data if isinstance(response.data, dict) else {}
        elif isinstance(response.data, dict):
            details = response.data
        else:
            details = {}
    else:
        code = "INTERNAL_SERVER_ERROR"
        message = SAFE_MESSAGES["INTERNAL_SERVER_ERROR"]
        details = {}

    response.data = _error_payload(code, message, details)
    return response
