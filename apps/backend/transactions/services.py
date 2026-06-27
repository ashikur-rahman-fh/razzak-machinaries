from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import Case, Count, DecimalField, Sum, Value, When
from django.db.models.functions import Coalesce
from django.utils import timezone

from customers.models import Customer
from customers.services import snapshot_customer_fields
from transactions.models import Transaction, TransactionItem, TransactionStatus, TransactionType
from transactions.money import compute_line_total, quantize_money
from transactions.validators import validate_positive_amount, validate_sale_items


@dataclass(frozen=True)
class LedgerAggregates:
    total_initial: Decimal
    total_sales: Decimal
    total_payments: Decimal
    transaction_count: int

    @property
    def current_balance(self) -> Decimal:
        return quantize_money(self.total_initial + self.total_sales - self.total_payments)


@dataclass(frozen=True)
class BalanceSummary:
    customer_id: int
    current_balance: Decimal
    total_initial: Decimal
    total_sales: Decimal
    total_payments: Decimal
    transaction_count: int
    cached_balance: Decimal | None = None


@dataclass(frozen=True)
class CorrectionResult:
    old_transaction: Transaction
    new_transaction: Transaction


def get_current_active_transactions(queryset=None):
    qs = queryset if queryset is not None else Transaction.objects.all()
    return qs.filter(is_current=True, status=TransactionStatus.ACTIVE)


def get_chain_latest_version(root_transaction_id: int) -> Transaction | None:
    return (
        Transaction.objects.filter(root_transaction_id=root_transaction_id)
        .order_by("-version_number", "-id")
        .first()
    )


def is_chain_active(root_transaction_id: int) -> bool:
    return get_current_active_transactions(
        Transaction.objects.filter(root_transaction_id=root_transaction_id)
    ).exists()


def _aggregate_ledger(queryset) -> LedgerAggregates:
    aggregates = get_current_active_transactions(queryset).aggregate(
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

    return LedgerAggregates(
        total_initial=quantize_money(aggregates["total_initial"] or Decimal("0")),
        total_sales=quantize_money(aggregates["total_sales"] or Decimal("0")),
        total_payments=quantize_money(aggregates["total_payments"] or Decimal("0")),
        transaction_count=aggregates["transaction_count"] or 0,
    )


def aggregate_amount_by_type(queryset, transaction_type: str) -> Decimal:
    result = (
        get_current_active_transactions(queryset)
        .filter(transaction_type=transaction_type)
        .aggregate(total=Sum("total_amount"))
    )
    return quantize_money(result["total"] or Decimal("0"))


def calculate_global_due() -> Decimal:
    return _aggregate_ledger(Transaction.objects.all()).current_balance


def calculate_customer_balances_bulk(customer_ids: list[int]) -> dict[int, Decimal]:
    if not customer_ids:
        return {}

    zero = Value(Decimal("0"), output_field=DecimalField(max_digits=14, decimal_places=2))
    rows = (
        get_current_active_transactions(Transaction.objects.filter(customer_id__in=customer_ids))
        .values("customer_id")
        .annotate(
            total_initial=Coalesce(
                Sum(
                    Case(
                        When(transaction_type=TransactionType.INITIAL, then="total_amount"),
                        default=zero,
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
                zero,
            ),
            total_sales=Coalesce(
                Sum(
                    Case(
                        When(transaction_type=TransactionType.SALE, then="total_amount"),
                        default=zero,
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
                zero,
            ),
            total_payments=Coalesce(
                Sum(
                    Case(
                        When(transaction_type=TransactionType.PAYMENT, then="total_amount"),
                        default=zero,
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
                zero,
            ),
        )
    )

    balances: dict[int, Decimal] = {customer_id: Decimal("0") for customer_id in customer_ids}
    for row in rows:
        customer_id = row["customer_id"]
        balances[customer_id] = quantize_money(
            (row["total_initial"] or Decimal("0"))
            + (row["total_sales"] or Decimal("0"))
            - (row["total_payments"] or Decimal("0"))
        )
    return balances


def calculate_customer_balance(customer_id: int) -> BalanceSummary:
    ledger = _aggregate_ledger(Transaction.objects.filter(customer_id=customer_id))
    cached_balance = (
        Customer.objects.filter(pk=customer_id).values_list("cached_balance", flat=True).first()
    )

    return BalanceSummary(
        customer_id=customer_id,
        current_balance=ledger.current_balance,
        total_initial=ledger.total_initial,
        total_sales=ledger.total_sales,
        total_payments=ledger.total_payments,
        transaction_count=ledger.transaction_count,
        cached_balance=cached_balance,
    )


def sync_customer_cached_balance(customer_id: int) -> Decimal:
    summary = calculate_customer_balance(customer_id)
    Customer.objects.filter(pk=customer_id).update(cached_balance=summary.current_balance)
    return summary.current_balance


def rebuild_all_customer_balances() -> int:
    updated = 0
    for customer_id in Customer.objects.values_list("id", flat=True):
        sync_customer_cached_balance(customer_id)
        updated += 1
    return updated


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


def _resolve_transaction_amounts(
    *,
    transaction_type: str,
    amount: Decimal | None,
    items: list[dict] | None,
) -> tuple[Decimal, Decimal, list[dict]]:
    if transaction_type == TransactionType.SALE:
        validated_items = validate_sale_items(items)
        built_items, total_amount = _build_sale_items(validated_items)
        return total_amount, total_amount, built_items

    if transaction_type in (TransactionType.INITIAL, TransactionType.PAYMENT):
        label = (
            "Initial balance" if transaction_type == TransactionType.INITIAL else "Payment amount"
        )
        tx_amount = validate_positive_amount(amount, field_label=label)
        return tx_amount, tx_amount, []

    raise ValueError(f"Unsupported transaction type: {transaction_type}")


def _finalize_root_transaction(transaction_obj: Transaction) -> None:
    if transaction_obj.root_transaction_id is None:
        transaction_obj.root_transaction = transaction_obj
        transaction_obj.save(update_fields=["root_transaction"])


def _create_transaction_items(transaction_obj: Transaction, built_items: list[dict]) -> None:
    if not built_items:
        return
    TransactionItem.objects.bulk_create(
        [TransactionItem(transaction=transaction_obj, **item_data) for item_data in built_items]
    )


def _ensure_customer_can_transact(customer: Customer) -> None:
    if customer.is_archived:
        raise ValueError("Archived customers cannot have new transactions.")


def _ensure_correctable(transaction_obj: Transaction) -> None:
    if not transaction_obj.is_current or transaction_obj.status != TransactionStatus.ACTIVE:
        raise ValueError("Only the current active version can be corrected or voided.")


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
    halkhata=None,
) -> Transaction:
    _ensure_customer_can_transact(customer)

    if halkhata is not None:
        from halkhata.exceptions import HalkhataClosed, HalkhataInvalidPayment
        from halkhata.models import HalkhataStatus

        if halkhata.status != HalkhataStatus.ACTIVE:
            raise HalkhataClosed()
        if transaction_type != TransactionType.PAYMENT:
            raise HalkhataInvalidPayment()

    note = (note or "").strip()
    payment_method = (payment_method or "").strip()

    tx_amount, total_amount, built_items = _resolve_transaction_amounts(
        transaction_type=transaction_type,
        amount=amount,
        items=items,
    )

    if transaction_type == TransactionType.INITIAL or transaction_type != TransactionType.PAYMENT:
        payment_method = ""

    transaction_obj = Transaction.objects.create(
        customer=customer,
        transaction_type=transaction_type,
        date=date,
        amount=tx_amount,
        total_amount=total_amount,
        note=note,
        payment_method=payment_method,
        status=TransactionStatus.ACTIVE,
        is_current=True,
        version_number=1,
        created_by=created_by,
        halkhata=halkhata,
        **snapshot_customer_fields(customer),
    )
    _finalize_root_transaction(transaction_obj)
    _create_transaction_items(transaction_obj, built_items)
    sync_customer_cached_balance(customer.pk)
    return transaction_obj


@db_transaction.atomic
def create_transaction_correction(
    *,
    source: Transaction,
    edit_reason: str,
    edited_by=None,
    transaction_type: str | None = None,
    date=None,
    note: str | None = None,
    payment_method: str | None = None,
    amount: Decimal | None = None,
    items: list[dict] | None = None,
) -> CorrectionResult:
    source = Transaction.objects.select_for_update().get(pk=source.pk)
    _ensure_correctable(source)

    resolved_type = transaction_type or source.transaction_type
    resolved_date = date if date is not None else source.date
    resolved_note = note if note is not None else source.note
    resolved_payment_method = (
        payment_method if payment_method is not None else source.payment_method
    )

    correction_items = items
    correction_amount = amount
    if resolved_type == TransactionType.SALE and correction_items is None:
        correction_items = [
            {
                "product_name": item.product_name,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
            }
            for item in source.items.all()
        ]
    if (
        resolved_type in (TransactionType.INITIAL, TransactionType.PAYMENT)
        and correction_amount is None
    ):
        correction_amount = source.amount

    tx_amount, total_amount, built_items = _resolve_transaction_amounts(
        transaction_type=resolved_type,
        amount=correction_amount,
        items=correction_items,
    )

    if resolved_type == TransactionType.INITIAL or resolved_type != TransactionType.PAYMENT:
        resolved_payment_method = ""

    source.status = TransactionStatus.SUPERSEDED
    source.is_current = False
    source.save(update_fields=["status", "is_current", "updated_at"])

    customer = source.customer
    new_transaction = Transaction.objects.create(
        customer=customer,
        transaction_type=resolved_type,
        date=resolved_date,
        amount=tx_amount,
        total_amount=total_amount,
        note=(resolved_note or "").strip(),
        payment_method=(resolved_payment_method or "").strip(),
        status=TransactionStatus.ACTIVE,
        is_current=True,
        version_number=source.version_number + 1,
        root_transaction=source.root_transaction,
        previous_version=source,
        edited_from=source,
        edit_reason=edit_reason.strip(),
        edited_by=edited_by,
        edited_at=timezone.now(),
        created_by=edited_by or source.created_by,
        halkhata=source.halkhata,
        **snapshot_customer_fields(customer),
    )
    _create_transaction_items(new_transaction, built_items)
    sync_customer_cached_balance(customer.pk)
    return CorrectionResult(old_transaction=source, new_transaction=new_transaction)


@db_transaction.atomic
def void_transaction(
    *,
    source: Transaction,
    void_reason: str,
    voided_by=None,
) -> Transaction:
    source = Transaction.objects.select_for_update().get(pk=source.pk)
    _ensure_correctable(source)

    source.status = TransactionStatus.VOIDED
    source.is_current = False
    source.void_reason = void_reason.strip()
    source.voided_by = voided_by
    source.voided_at = timezone.now()
    source.save(
        update_fields=[
            "status",
            "is_current",
            "void_reason",
            "voided_by",
            "voided_at",
            "updated_at",
        ]
    )
    sync_customer_cached_balance(source.customer_id)
    return source


def get_transaction_history(transaction_id: int) -> list[Transaction]:
    transaction_obj = Transaction.objects.get(pk=transaction_id)
    root_id = transaction_obj.root_transaction_id or transaction_obj.pk
    return list(
        Transaction.objects.filter(root_transaction_id=root_id)
        .select_related("customer", "created_by", "edited_by", "voided_by", "previous_version")
        .prefetch_related("items")
        .order_by("version_number", "id")
    )


def resolve_transaction_for_staff_view(transaction_obj: Transaction) -> Transaction:
    """Return the latest version in a transaction chain for staff read access."""
    root_id = transaction_obj.root_transaction_id or transaction_obj.pk
    latest = (
        Transaction.objects.filter(root_transaction_id=root_id)
        .order_by("-version_number", "-id")
        .first()
    )
    return latest if latest is not None else transaction_obj
