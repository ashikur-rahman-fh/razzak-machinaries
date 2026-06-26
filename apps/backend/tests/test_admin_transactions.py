from decimal import Decimal
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from tests.test_admin_auth import _create_superuser, _login
from tests.test_admin_customers import _auth_get, _auth_post_json, _create_customer
from tests.test_api import assert_error_envelope
from transactions.models import Transaction, TransactionItem, TransactionType
from transactions.services import calculate_customer_balance

pytestmark = pytest.mark.django_db

TRANSACTIONS_URL = "/api/admin/transactions/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


@pytest.fixture
def customer():
    return _create_customer()


def _initial_payload(customer_id: int, amount: str = "500.00", **overrides):
    payload = {
        "customerId": customer_id,
        "transactionType": "INITIAL",
        "date": "2026-01-01",
        "amount": amount,
        "note": "Opening balance",
    }
    payload.update(overrides)
    return payload


def _sale_payload(customer_id: int, **overrides):
    payload = {
        "customerId": customer_id,
        "transactionType": "SALE",
        "date": "2026-01-15",
        "note": "Machinery sale",
        "items": [
            {"productName": "Tractor", "unitPrice": "1000.00", "quantity": "2"},
            {"productName": "Plow", "unitPrice": "250.50", "quantity": "1"},
        ],
    }
    payload.update(overrides)
    return payload


def _payment_payload(customer_id: int, amount: str = "300.00", **overrides):
    payload = {
        "customerId": customer_id,
        "transactionType": "PAYMENT",
        "date": "2026-02-01",
        "amount": amount,
        "paymentMethod": "cash",
        "note": "Partial payment",
    }
    payload.update(overrides)
    return payload


def test_create_initial_transaction(superuser_client, customer):
    response = _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id))
    assert response.status_code == 201
    assert response.data["transactionType"] == "INITIAL"
    assert response.data["totalAmount"] == "500.00"
    assert response.data["balanceImpact"] == "+500.00"

    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("500.00")
    assert Transaction.objects.count() == 1


def test_create_sale_with_multiple_items(superuser_client, customer):
    response = _auth_post_json(superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id))
    assert response.status_code == 201
    assert response.data["transactionType"] == "SALE"
    assert response.data["totalAmount"] == "2250.50"
    assert len(response.data["items"]) == 2

    tx = Transaction.objects.get()
    assert tx.total_amount == Decimal("2250.50")
    items = list(TransactionItem.objects.filter(transaction=tx).order_by("id"))
    assert items[0].line_total == Decimal("2000.00")
    assert items[1].line_total == Decimal("250.50")

    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("2250.50")


def test_create_payment(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "1000.00"))
    response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _payment_payload(customer.id, "400.00")
    )
    assert response.status_code == 201
    assert response.data["transactionType"] == "PAYMENT"
    assert response.data["paymentMethod"] == "cash"
    assert response.data["balanceImpact"] == "-400.00"

    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("600.00")


def test_customer_balance_endpoint(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00"))
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id))
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _payment_payload(customer.id, "250.50"))

    response = _auth_get(superuser_client, f"/api/admin/customers/{customer.id}/balance/")
    assert response.status_code == 200
    assert response.data["currentBalance"] == "2500.00"
    assert response.data["totalInitial"] == "500.00"
    assert response.data["totalSales"] == "2250.50"
    assert response.data["totalPayments"] == "250.50"
    assert response.data["transactionCount"] == 3
    assert response.data["cachedBalance"] == "2500.00"


def test_balance_calculation_service(customer):
    from transactions.services import create_transaction

    create_transaction(
        customer=customer,
        transaction_type=TransactionType.INITIAL,
        date="2026-01-01",
        amount=Decimal("100.00"),
    )
    create_transaction(
        customer=customer,
        transaction_type=TransactionType.SALE,
        date="2026-01-02",
        items=[{"product_name": "Item", "unit_price": Decimal("50.00"), "quantity": Decimal("3")}],
    )
    create_transaction(
        customer=customer,
        transaction_type=TransactionType.PAYMENT,
        date="2026-01-03",
        amount=Decimal("75.00"),
    )

    summary = calculate_customer_balance(customer.id)
    assert summary.current_balance == Decimal("175.00")
    assert summary.total_initial == Decimal("100.00")
    assert summary.total_sales == Decimal("150.00")
    assert summary.total_payments == Decimal("75.00")


def test_sale_without_items_rejected(superuser_client, customer):
    response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        {
            "customerId": customer.id,
            "transactionType": "SALE",
            "date": "2026-01-01",
            "items": [],
        },
    )
    assert response.status_code == 400
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_invalid_zero_amount_rejected(superuser_client, customer):
    response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _initial_payload(customer.id, "0.00"),
    )
    assert response.status_code == 400
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_invalid_negative_payment_rejected(superuser_client, customer):
    response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _payment_payload(customer.id, "-10.00"),
    )
    assert response.status_code == 400
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_sale_line_total_calculated_server_side(superuser_client, customer):
    response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        {
            "customerId": customer.id,
            "transactionType": "SALE",
            "date": "2026-01-01",
            "items": [{"productName": "Gear", "unitPrice": "99.99", "quantity": "3"}],
        },
    )
    assert response.status_code == 201
    assert response.data["totalAmount"] == "299.97"
    assert response.data["items"][0]["lineTotal"] == "299.97"


def test_atomic_rollback_on_item_creation_failure(superuser_client, customer):
    with (
        patch(
            "transactions.services.TransactionItem.objects.bulk_create",
            side_effect=RuntimeError("simulated failure"),
        ),
        pytest.raises(RuntimeError, match="simulated failure"),
    ):
        _auth_post_json(superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id))

    assert Transaction.objects.count() == 0
    assert TransactionItem.objects.count() == 0
    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("0.00")


def test_list_transactions_filter_by_customer(superuser_client, customer):
    other = _create_customer(phone_en="01722222222", phone="+8801722222222")
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id))
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(other.id, "200.00"))

    response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}?customerId={customer.id}")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["customerId"] == customer.id


def test_customer_transactions_nested_endpoint(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id))
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _payment_payload(customer.id, "100.00"))

    response = _auth_get(superuser_client, f"/api/admin/customers/{customer.id}/transactions/")
    assert response.status_code == 200
    assert response.data["count"] == 2


def test_customer_transactions_with_transaction_ordering(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id))

    response = _auth_get(
        superuser_client,
        f"/api/admin/customers/{customer.id}/transactions/?ordering=-date&pageSize=10",
    )
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_customer_balance_with_transaction_ordering_param(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id))

    response = _auth_get(
        superuser_client,
        f"/api/admin/customers/{customer.id}/balance/?ordering=-date",
    )
    assert response.status_code == 200
    assert response.data["currentBalance"] == "500.00"


def test_transaction_detail(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id)
    )
    tx_id = create_response.data["id"]
    response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{tx_id}/")
    assert response.status_code == 200
    assert response.data["id"] == tx_id


def test_sale_confirmation_endpoint(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00"))
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id)
    )
    tx_id = create_response.data["id"]

    response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{tx_id}/confirmation/")
    assert response.status_code == 200
    assert response.data["displayId"] == f"COM-{tx_id}"
    assert response.data["transactionType"] == "SALE"
    assert response.data["totalAmount"] == "2250.50"
    assert len(response.data["items"]) == 2
    assert response.data["customerNameBn"] == customer.full_name_bn
    assert response.data["currentBalance"] == "2750.50"


def test_payment_confirmation_endpoint(superuser_client, customer):
    _auth_post_json(superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "1000.00"))
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _payment_payload(customer.id, "400.00")
    )
    tx_id = create_response.data["id"]

    response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{tx_id}/confirmation/")
    assert response.status_code == 200
    assert response.data["transactionType"] == "PAYMENT"
    assert response.data["paymentMethod"] == "cash"
    assert response.data["totalAmount"] == "400.00"
    assert response.data["items"] == []
    assert response.data["currentBalance"] == "600.00"


def test_initial_confirmation_not_available(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id)
    )
    tx_id = create_response.data["id"]

    response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{tx_id}/confirmation/")
    assert response.status_code == 404
    assert_error_envelope(response, status_code=404, code="CONFIRMATION_NOT_AVAILABLE")


def test_confirmation_requires_auth(superuser_client, customer):
    sale_response = _auth_post_json(superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id))
    tx_id = sale_response.data["id"]

    response = APIClient().get(f"{TRANSACTIONS_URL}{tx_id}/confirmation/")
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")
