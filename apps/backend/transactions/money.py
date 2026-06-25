from decimal import ROUND_HALF_UP, Decimal

MONEY_QUANTIZE = Decimal("0.01")
TWO_PLACES = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTIZE, rounding=ROUND_HALF_UP)


def compute_line_total(unit_price: Decimal, quantity: Decimal) -> Decimal:
    return quantize_money(unit_price * quantity)
