from rest_framework import status
from rest_framework.exceptions import APIException

ARCHIVED_CUSTOMER_FOLLOW_UP_CODE = "ARCHIVED_CUSTOMER_FOLLOW_UP"
ARCHIVED_CUSTOMER_FOLLOW_UP_MESSAGE = (
    "Follow-ups cannot be created or updated for archived customers."
)

INVALID_FOLLOW_UP_DATE_CODE = "INVALID_FOLLOW_UP_DATE"
INVALID_FOLLOW_UP_DATE_MESSAGE = "Follow-up date must be today or a future date."

FOLLOW_UP_NOT_ACTIONABLE_CODE = "FOLLOW_UP_NOT_ACTIONABLE"
FOLLOW_UP_NOT_ACTIONABLE_MESSAGE = "This follow-up cannot be updated in its current state."


class ArchivedCustomerFollowUp(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = ARCHIVED_CUSTOMER_FOLLOW_UP_CODE
    default_detail = ARCHIVED_CUSTOMER_FOLLOW_UP_MESSAGE


class InvalidFollowUpDate(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = INVALID_FOLLOW_UP_DATE_CODE
    default_detail = INVALID_FOLLOW_UP_DATE_MESSAGE


class FollowUpNotActionable(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = FOLLOW_UP_NOT_ACTIONABLE_CODE
    default_detail = FOLLOW_UP_NOT_ACTIONABLE_MESSAGE
