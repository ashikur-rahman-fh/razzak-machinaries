from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import Count, F, Max, Sum, Value, Window
from django.db.models.functions import Coalesce, RowNumber
from django.utils import timezone

from customers.models import Customer
from halkhata.exceptions import HalkhataClosed
from halkhata.models import Halkhata, HalkhataStatus
from transactions.models import Transaction, TransactionType
from transactions.money import quantize_money
from transactions.services import create_transaction, get_current_active_transactions


@dataclass(frozen=True)
class HalkhataStats:
    total_collected: Decimal
    payment_count: int
    average_payment: Decimal
    highest_payment: Decimal
    unique_customers_paid: int
    today_collection: Decimal
    remaining_due_of_paid_customers: Decimal


def get_halkhata_payment_queryset(halkhata_id: int):
    return get_current_active_transactions(
        Transaction.objects.filter(
            halkhata_id=halkhata_id,
            transaction_type=TransactionType.PAYMENT,
        )
    ).select_related("customer", "created_by")


def annotate_halkhata_payment_numbers(queryset):
    return queryset.annotate(
        payment_number=Window(
            expression=RowNumber(),
            order_by=[F("created_at").asc(), F("id").asc()],
        )
    )


def compute_halkhata_stats(halkhata: Halkhata) -> HalkhataStats:
    payment_qs = get_halkhata_payment_queryset(halkhata.pk)
    aggregates = payment_qs.aggregate(
        total_collected=Coalesce(Sum("total_amount"), Value(Decimal("0"))),
        payment_count=Count("id"),
        highest_payment=Coalesce(Max("total_amount"), Value(Decimal("0"))),
        unique_customers_paid=Count("customer_id", distinct=True),
    )

    total_collected = quantize_money(aggregates["total_collected"])
    payment_count = aggregates["payment_count"] or 0
    highest_payment = quantize_money(aggregates["highest_payment"])
    unique_customers_paid = aggregates["unique_customers_paid"] or 0

    average_payment = (
        quantize_money(total_collected / payment_count) if payment_count > 0 else Decimal("0")
    )

    today = timezone.localdate()
    today_result = payment_qs.filter(date=today).aggregate(
        total=Coalesce(Sum("total_amount"), Value(Decimal("0")))
    )
    today_collection = quantize_money(today_result["total"])

    customer_ids = list(payment_qs.values_list("customer_id", flat=True).distinct())
    remaining_due = Decimal("0")
    if customer_ids:
        remaining_due = quantize_money(
            Customer.objects.filter(pk__in=customer_ids).aggregate(
                total=Coalesce(Sum("cached_balance"), Value(Decimal("0")))
            )["total"]
        )

    return HalkhataStats(
        total_collected=total_collected,
        payment_count=payment_count,
        average_payment=average_payment,
        highest_payment=highest_payment,
        unique_customers_paid=unique_customers_paid,
        today_collection=today_collection,
        remaining_due_of_paid_customers=remaining_due,
    )


def ensure_halkhata_accepts_payments(halkhata: Halkhata) -> None:
    if halkhata.status != HalkhataStatus.ACTIVE:
        raise HalkhataClosed()


@db_transaction.atomic
def create_halkhata(
    *,
    title: str,
    date,
    notes: str = "",
    created_by=None,
) -> Halkhata:
    return Halkhata.objects.create(
        title=title.strip(),
        date=date,
        status=HalkhataStatus.ACTIVE,
        notes=(notes or "").strip(),
        created_by=created_by,
    )


@db_transaction.atomic
def update_halkhata(
    halkhata: Halkhata,
    *,
    notes: str | None = None,
    status: str | None = None,
) -> Halkhata:
    halkhata = Halkhata.objects.select_for_update().get(pk=halkhata.pk)
    update_fields: list[str] = ["updated_at"]

    if notes is not None:
        halkhata.notes = notes.strip()
        update_fields.append("notes")

    if status is not None:
        halkhata.status = status
        update_fields.append("status")

    if len(update_fields) > 1:
        halkhata.save(update_fields=update_fields)

    return halkhata


@db_transaction.atomic
def create_halkhata_payment(
    *,
    halkhata: Halkhata,
    customer: Customer,
    amount: Decimal,
    date,
    note: str = "",
    payment_method: str = "",
    created_by=None,
) -> Transaction:
    ensure_halkhata_accepts_payments(halkhata)
    return create_transaction(
        customer=customer,
        transaction_type=TransactionType.PAYMENT,
        date=date,
        amount=amount,
        note=note,
        payment_method=payment_method,
        created_by=created_by,
        halkhata=halkhata,
    )
