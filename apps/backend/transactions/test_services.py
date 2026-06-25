from decimal import Decimal

import pytest

from tests.test_admin_customers import _create_customer
from transactions.models import TransactionType
from transactions.money import compute_line_total, quantize_money
from transactions.services import create_transaction, sync_customer_cached_balance

pytestmark = pytest.mark.django_db


@pytest.fixture
def customer():
    return _create_customer()


def test_quantize_money():
    assert quantize_money(Decimal("10.005")) == Decimal("10.01")


def test_compute_line_total():
    assert compute_line_total(Decimal("99.99"), Decimal("3")) == Decimal("299.97")


def test_sync_customer_cached_balance(customer):
    create_transaction(
        customer=customer,
        transaction_type=TransactionType.INITIAL,
        date="2026-01-01",
        amount=Decimal("123.45"),
    )
    balance = sync_customer_cached_balance(customer.id)
    assert balance == Decimal("123.45")
    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("123.45")
