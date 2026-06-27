from rest_framework import status
from rest_framework.exceptions import APIException

HALKHATA_CLOSED_CODE = "HALKHATA_CLOSED"
HALKHATA_CLOSED_MESSAGE = "Payments cannot be recorded on a closed Halkhata."

HALKHATA_INVALID_PAYMENT_CODE = "HALKHATA_INVALID_PAYMENT"
HALKHATA_INVALID_PAYMENT_MESSAGE = "Only payment transactions can be linked to a Halkhata."

HALKHATA_INVITATION_NO_CUSTOMERS_CODE = "HALKHATA_INVITATION_NO_CUSTOMERS"
HALKHATA_INVITATION_NO_CUSTOMERS_MESSAGE = (
    "Select at least one customer to generate invitation cards."
)

HALKHATA_INVITATION_INVALID_CUSTOMERS_CODE = "HALKHATA_INVITATION_INVALID_CUSTOMERS"
HALKHATA_INVITATION_INVALID_CUSTOMERS_MESSAGE = (
    "One or more selected customers are invalid or archived."
)


class HalkhataClosed(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = HALKHATA_CLOSED_CODE
    default_detail = HALKHATA_CLOSED_MESSAGE


class HalkhataInvalidPayment(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = HALKHATA_INVALID_PAYMENT_CODE
    default_detail = HALKHATA_INVALID_PAYMENT_MESSAGE


class HalkhataInvitationNoCustomers(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = HALKHATA_INVITATION_NO_CUSTOMERS_CODE
    default_detail = HALKHATA_INVITATION_NO_CUSTOMERS_MESSAGE


class HalkhataInvitationInvalidCustomers(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = HALKHATA_INVITATION_INVALID_CUSTOMERS_CODE
    default_detail = HALKHATA_INVITATION_INVALID_CUSTOMERS_MESSAGE
