from decimal import Decimal

from transactions.exceptions import (
    InvalidSaleItemQuantity,
    InvalidSaleItems,
    InvalidSaleItemUnitPrice,
    InvalidTransactionAmount,
)


def validate_positive_amount(amount: Decimal | None, *, field_label: str = "Amount") -> Decimal:
    if amount is None:
        raise InvalidTransactionAmount(detail=f"{field_label} is required.")
    if amount <= Decimal("0"):
        raise InvalidTransactionAmount(detail=f"{field_label} must be greater than zero.")
    return amount


def validate_sale_items(items: list[dict] | None) -> list[dict]:
    if not items:
        raise InvalidSaleItems()

    validated: list[dict] = []
    for index, item in enumerate(items):
        product_name = (item.get("product_name") or "").strip()
        if not product_name:
            raise InvalidSaleItems(detail=f"Item {index + 1}: product name is required.")

        unit_price = item.get("unit_price")
        quantity = item.get("quantity")

        if unit_price is None:
            raise InvalidSaleItemUnitPrice(detail=f"Item {index + 1}: unit price is required.")
        if unit_price < Decimal("0"):
            raise InvalidSaleItemUnitPrice(
                detail=f"Item {index + 1}: unit price must be zero or greater."
            )
        if quantity is None:
            raise InvalidSaleItemQuantity(detail=f"Item {index + 1}: quantity is required.")
        if quantity <= Decimal("0"):
            raise InvalidSaleItemQuantity(
                detail=f"Item {index + 1}: quantity must be greater than zero."
            )

        validated.append(
            {
                "product_name": product_name,
                "unit_price": unit_price,
                "quantity": quantity,
            }
        )

    return validated
