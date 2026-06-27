from decimal import Decimal

import pytest
from django.utils import timezone

from halkhata.services import compute_halkhata_stats, create_halkhata
from tests.factories import create_staff_user
from tests.test_admin_customers import _create_customer
from transactions.models import TransactionType
from transactions.services import create_transaction, void_transaction

pytestmark = pytest.mark.django_db


def _create_halkhata(**overrides):
    staff = create_staff_user()
    defaults = {
        "title": "Halkhata 2026",
        "date": timezone.localdate(),
        "created_by": staff,
    }
    defaults.update(overrides)
    return create_halkhata(**defaults)


def test_compute_halkhata_stats_empty():
    halkhata = _create_halkhata()
    stats = compute_halkhata_stats(halkhata)
    assert stats.total_collected == Decimal("0")
    assert stats.payment_count == 0
    assert stats.average_payment == Decimal("0")
    assert stats.highest_payment == Decimal("0")
    assert stats.unique_customers_paid == 0
    assert stats.today_collection == Decimal("0")
    assert stats.remaining_due_of_paid_customers == Decimal("0")


def test_compute_halkhata_stats_with_payments():
    halkhata = _create_halkhata()
    customer_a = _create_customer(full_name_en="Customer A", phone_en="01710000001")
    customer_b = _create_customer(full_name_en="Customer B", phone_en="01710000002")
    staff = create_staff_user(username="stats-staff")

    create_transaction(
        customer=customer_a,
        transaction_type=TransactionType.INITIAL,
        date=timezone.localdate(),
        amount=Decimal("1000.00"),
        created_by=staff,
    )
    create_transaction(
        customer=customer_b,
        transaction_type=TransactionType.INITIAL,
        date=timezone.localdate(),
        amount=Decimal("500.00"),
        created_by=staff,
    )

    create_transaction(
        customer=customer_a,
        transaction_type=TransactionType.PAYMENT,
        date=timezone.localdate(),
        amount=Decimal("300.00"),
        created_by=staff,
        halkhata=halkhata,
    )
    create_transaction(
        customer=customer_b,
        transaction_type=TransactionType.PAYMENT,
        date=timezone.localdate(),
        amount=Decimal("200.00"),
        created_by=staff,
        halkhata=halkhata,
    )

    stats = compute_halkhata_stats(halkhata)
    assert stats.total_collected == Decimal("500.00")
    assert stats.payment_count == 2
    assert stats.average_payment == Decimal("250.00")
    assert stats.highest_payment == Decimal("300.00")
    assert stats.unique_customers_paid == 2
    assert stats.today_collection == Decimal("500.00")

    customer_a.refresh_from_db()
    customer_b.refresh_from_db()
    assert stats.remaining_due_of_paid_customers == (
        customer_a.cached_balance + customer_b.cached_balance
    )


def test_compute_halkhata_stats_excludes_voided():
    halkhata = _create_halkhata()
    customer = _create_customer(phone_en="01710000003")
    staff = create_staff_user(username="void-staff")

    create_transaction(
        customer=customer,
        transaction_type=TransactionType.INITIAL,
        date=timezone.localdate(),
        amount=Decimal("1000.00"),
        created_by=staff,
    )
    payment = create_transaction(
        customer=customer,
        transaction_type=TransactionType.PAYMENT,
        date=timezone.localdate(),
        amount=Decimal("400.00"),
        created_by=staff,
        halkhata=halkhata,
    )
    void_transaction(source=payment, void_reason="Mistake", voided_by=staff)

    stats = compute_halkhata_stats(halkhata)
    assert stats.total_collected == Decimal("0")
    assert stats.payment_count == 0
