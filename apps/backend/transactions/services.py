from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import Case, Count, DecimalField, Sum, Value, When

from customers.models import Customer
from transactions.models import Transaction, TransactionItem, TransactionType
from transactions.money import compute_line_total, quantize_money
from transactions.validators import validate_positive_amount, validate_sale_items


@dataclass(frozen=True)
class BalanceSummary:
    customer_id: int
    current_balance: Decimal
    total_initial: Decimal
    total_sales: Decimal
    total_payments: Decimal
    transaction_count: int
    cached_balance: Decimal | None = None


def calculate_customer_balance(customer_id: int) -> BalanceSummary:
    aggregates = Transaction.objects.filter(customer_id=customer_id).aggregate(
        total_initial=Sum(
            Case(
                When(transaction_type=TransactionType.INITIAL, then="total_amount"),
                default=Value(0),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        total_sales=Sum(
            Case(
                When(transaction_type=TransactionType.SALE, then="total_amount"),
                default=Value(0),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        total_payments=Sum(
            Case(
                When(transaction_type=TransactionType.PAYMENT, then="total_amount"),
                default=Value(0),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        transaction_count=Count("id"),
    )

    total_initial = aggregates["total_initial"] or Decimal("0")
    total_sales = aggregates["total_sales"] or Decimal("0")
    total_payments = aggregates["total_payments"] or Decimal("0")
    current_balance = quantize_money(total_initial + total_sales - total_payments)

    cached_balance = (
        Customer.objects.filter(pk=customer_id).values_list("cached_balance", flat=True).first()
    )

    return BalanceSummary(
        customer_id=customer_id,
        current_balance=current_balance,
        total_initial=quantize_money(total_initial),
        total_sales=quantize_money(total_sales),
        total_payments=quantize_money(total_payments),
        transaction_count=aggregates["transaction_count"] or 0,
        cached_balance=cached_balance,
    )


def sync_customer_cached_balance(customer_id: int) -> Decimal:
    summary = calculate_customer_balance(customer_id)
    Customer.objects.filter(pk=customer_id).update(cached_balance=summary.current_balance)
    return summary.current_balance


def _build_sale_items(validated_items: list[dict]) -> tuple[list[dict], Decimal]:
    built_items: list[dict] = []
    total = Decimal("0")
    for item in validated_items:
        line_total = compute_line_total(item["unit_price"], item["quantity"])
        built_items.append(
            {
                "product_name": item["product_name"],
                "unit_price": quantize_money(item["unit_price"]),
                "quantity": item["quantity"],
                "line_total": line_total,
            }
        )
        total += line_total
    return built_items, quantize_money(total)


@db_transaction.atomic
def create_transaction(
    *,
    customer: Customer,
    transaction_type: str,
    date,
    note: str = "",
    payment_method: str = "",
    amount: Decimal | None = None,
    items: list[dict] | None = None,
    created_by=None,
) -> Transaction:
    note = (note or "").strip()
    payment_method = (payment_method or "").strip()

    if transaction_type == TransactionType.SALE:
        validated_items = validate_sale_items(items)
        built_items, total_amount = _build_sale_items(validated_items)
        tx_amount = total_amount
    elif transaction_type in (TransactionType.INITIAL, TransactionType.PAYMENT):
        label = (
            "Initial balance" if transaction_type == TransactionType.INITIAL else "Payment amount"
        )
        tx_amount = validate_positive_amount(amount, field_label=label)
        total_amount = tx_amount
        built_items = []
        if transaction_type == TransactionType.INITIAL:
            payment_method = ""
    else:
        raise ValueError(f"Unsupported transaction type: {transaction_type}")

    transaction_obj = Transaction.objects.create(
        customer=customer,
        transaction_type=transaction_type,
        date=date,
        amount=tx_amount,
        total_amount=total_amount,
        note=note,
        payment_method=payment_method if transaction_type == TransactionType.PAYMENT else "",
        created_by=created_by,
    )

    if built_items:
        TransactionItem.objects.bulk_create(
            [TransactionItem(transaction=transaction_obj, **item_data) for item_data in built_items]
        )

    sync_customer_cached_balance(customer.pk)
    return transaction_obj
