from rest_framework.exceptions import APIException


class InvalidTransactionAmount(APIException):
    status_code = 400
    default_code = "INVALID_TRANSACTION_AMOUNT"
    default_detail = "Transaction amount must be greater than zero."


class InvalidSaleItems(APIException):
    status_code = 400
    default_code = "INVALID_SALE_ITEMS"
    default_detail = "Sale transactions must include at least one valid item."


class InvalidSaleItemQuantity(APIException):
    status_code = 400
    default_code = "INVALID_SALE_ITEM_QUANTITY"
    default_detail = "Sale item quantity must be greater than zero."


class InvalidSaleItemUnitPrice(APIException):
    status_code = 400
    default_code = "INVALID_SALE_ITEM_UNIT_PRICE"
    default_detail = "Sale item unit price must be zero or greater."


INVALID_TRANSACTION_AMOUNT_MESSAGE = InvalidTransactionAmount.default_detail
INVALID_SALE_ITEMS_MESSAGE = InvalidSaleItems.default_detail
INVALID_SALE_ITEM_QUANTITY_MESSAGE = InvalidSaleItemQuantity.default_detail
INVALID_SALE_ITEM_UNIT_PRICE_MESSAGE = InvalidSaleItemUnitPrice.default_detail
