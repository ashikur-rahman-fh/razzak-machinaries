from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from halkhata.models import HalkhataStatus
from tests.factories import create_regular_user, create_staff_user, create_superuser
from tests.test_admin_auth import _fetch_csrf, _login
from tests.test_admin_customers import (
    _auth_get,
    _auth_patch_json,
    _auth_post_json,
    _create_customer,
)
from tests.test_admin_transactions import _initial_payload, _payment_payload
from tests.test_api import assert_error_envelope
from transactions.models import Transaction, TransactionType

pytestmark = pytest.mark.django_db

HALKHATAS_URL = "/api/admin/halkhatas/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


@pytest.fixture
def customer():
    return _create_customer()


def _halkhata_detail_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/"


def _halkhata_payments_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/payments/"


def _halkhata_transactions_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/transactions/"


def _halkhata_stats_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/stats/"


def _valid_halkhata_payload(**overrides):
    payload = {
        "title": "Summer Collection 2026",
        "date": "2026-06-27",
    }
    payload.update(overrides)
    return payload


def _halkhata_payment_payload(customer_id: int, **overrides):
    payload = {
        "customerId": customer_id,
        "amount": "500.00",
        "date": "2026-06-27",
        "paymentMethod": "cash",
        "note": "Halkhata payment",
    }
    payload.update(overrides)
    return payload


def test_create_halkhata(superuser_client):
    response = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload())
    assert response.status_code == 201
    assert response.data["title"] == "Summer Collection 2026"
    assert response.data["date"] == "2026-06-27"
    assert response.data["status"] == HalkhataStatus.ACTIVE
    assert response.data["createdByName"] == "admin"


def test_create_halkhata_validation(superuser_client):
    response = _auth_post_json(
        superuser_client,
        HALKHATAS_URL,
        {"title": "  ", "date": "2026-06-27"},
    )
    assert response.status_code == 400

    response = _auth_post_json(superuser_client, HALKHATAS_URL, {"title": "Valid Name"})
    assert response.status_code == 400


def test_list_halkhatas_by_status_filter(superuser_client):
    active = _auth_post_json(
        superuser_client,
        HALKHATAS_URL,
        _valid_halkhata_payload(title="Active Session"),
    ).data
    closed = _auth_post_json(
        superuser_client,
        HALKHATAS_URL,
        _valid_halkhata_payload(title="Closed Session", date="2026-06-26"),
    ).data
    _auth_patch_json(
        superuser_client,
        _halkhata_detail_url(closed["id"]),
        {"status": HalkhataStatus.CLOSED},
    )

    response = _auth_get(superuser_client, HALKHATAS_URL)
    assert response.status_code == 200
    assert response.data["count"] == 2
    titles = {item["title"] for item in response.data["results"]}
    assert titles == {"Active Session", "Closed Session"}

    response = _auth_get(superuser_client, f"{HALKHATAS_URL}?status=active")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == active["id"]
    assert response.data["results"][0]["status"] == HalkhataStatus.ACTIVE

    response = _auth_get(superuser_client, f"{HALKHATAS_URL}?status=closed")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == closed["id"]
    assert response.data["results"][0]["status"] == HalkhataStatus.CLOSED

    response = _auth_get(superuser_client, f"{HALKHATAS_URL}?status=invalid")
    assert response.status_code == 200
    assert response.data["count"] == 2


def test_list_halkhatas_with_stats(superuser_client, customer):
    create_response = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload())
    halkhata_id = create_response.data["id"]

    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )
    _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata_id),
        _halkhata_payment_payload(customer.id, amount="300.00"),
    )

    response = _auth_get(superuser_client, HALKHATAS_URL)
    assert response.status_code == 200
    assert response.data["count"] == 1
    item = response.data["results"][0]
    assert item["totalCollected"] == "300.00"
    assert item["paymentCount"] == 1


def test_create_halkhata_payment(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )

    response = _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="400.00"),
    )
    assert response.status_code == 201
    assert response.data["transactionType"] == "PAYMENT"
    assert response.data["totalAmount"] == "400.00"

    tx = Transaction.objects.get(pk=response.data["id"])
    assert tx.halkhata_id == halkhata["id"]

    customer.refresh_from_db()
    assert customer.cached_balance == Decimal("600.00")


def test_halkhata_transactions_list_only_linked(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )
    _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="200.00"),
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _payment_payload(customer.id, amount="100.00"),
    )

    response = _auth_get(superuser_client, _halkhata_transactions_url(halkhata["id"]))
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["totalAmount"] == "200.00"


def test_halkhata_detail_returns_collected_stats(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )
    _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="250.00"),
    )

    response = _auth_get(superuser_client, _halkhata_detail_url(halkhata["id"]))
    assert response.status_code == 200
    assert response.data["totalCollected"] == "250.00"
    assert response.data["paymentCount"] == 1
    assert response.data["stats"]["totalCollected"] == "250.00"
    assert response.data["stats"]["paymentCount"] == 1


def test_halkhata_transactions_payment_numbers(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "5000.00"),
    )

    for amount in ("100.00", "200.00", "300.00"):
        _auth_post_json(
            superuser_client,
            _halkhata_payments_url(halkhata["id"]),
            _halkhata_payment_payload(customer.id, amount=amount),
        )

    response = _auth_get(
        superuser_client,
        f"{_halkhata_transactions_url(halkhata['id'])}?ordering=-createdAt",
    )
    assert response.status_code == 200
    assert response.data["count"] == 3
    payment_numbers = [item["paymentNumber"] for item in response.data["results"]]
    assert payment_numbers == [3, 2, 1]


def test_halkhata_transactions_payment_numbers_paginated(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "10000.00"),
    )

    for index in range(1, 4):
        _auth_post_json(
            superuser_client,
            _halkhata_payments_url(halkhata["id"]),
            _halkhata_payment_payload(customer.id, amount=f"{index * 10}.00"),
        )

    page_one = _auth_get(
        superuser_client,
        f"{_halkhata_transactions_url(halkhata['id'])}?ordering=-createdAt&page=1&pageSize=2",
    )
    assert page_one.status_code == 200
    assert [item["paymentNumber"] for item in page_one.data["results"]] == [3, 2]

    page_two = _auth_get(
        superuser_client,
        f"{_halkhata_transactions_url(halkhata['id'])}?ordering=-createdAt&page=2&pageSize=2",
    )
    assert page_two.status_code == 200
    assert [item["paymentNumber"] for item in page_two.data["results"]] == [1]


def test_halkhata_stats_endpoint(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )
    _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="250.00"),
    )

    response = _auth_get(superuser_client, _halkhata_stats_url(halkhata["id"]))
    assert response.status_code == 200
    assert response.data["totalCollected"] == "250.00"
    assert response.data["paymentCount"] == 1
    assert response.data["averagePayment"] == "250.00"
    assert response.data["highestPayment"] == "250.00"
    assert response.data["uniqueCustomersPaid"] == 1


def test_closed_halkhata_rejects_payment(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_patch_json(
        superuser_client,
        _halkhata_detail_url(halkhata["id"]),
        {"status": HalkhataStatus.CLOSED},
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )

    response = _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id),
    )
    assert response.status_code == 400
    assert_error_envelope(response, status_code=400, code="HALKHATA_CLOSED")


def test_reopen_halkhata_allows_payment(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_patch_json(
        superuser_client,
        _halkhata_detail_url(halkhata["id"]),
        {"status": HalkhataStatus.CLOSED},
    )
    _auth_patch_json(
        superuser_client,
        _halkhata_detail_url(halkhata["id"]),
        {"status": HalkhataStatus.ACTIVE},
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )

    response = _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="150.00"),
    )
    assert response.status_code == 201


def test_correction_preserves_halkhata_link(superuser_client, customer):
    halkhata = _auth_post_json(superuser_client, HALKHATAS_URL, _valid_halkhata_payload()).data
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00"),
    )
    payment_response = _auth_post_json(
        superuser_client,
        _halkhata_payments_url(halkhata["id"]),
        _halkhata_payment_payload(customer.id, amount="200.00"),
    )
    payment_id = payment_response.data["id"]

    correction_response = _auth_post_json(
        superuser_client,
        f"/api/admin/transactions/{payment_id}/create-correction/",
        {
            "amount": "250.00",
            "editReason": "Correct amount",
        },
    )
    assert correction_response.status_code == 201
    new_tx = Transaction.objects.get(pk=correction_response.data["newTransaction"]["id"])
    assert new_tx.halkhata_id == halkhata["id"]
    assert new_tx.transaction_type == TransactionType.PAYMENT


def test_halkhata_permissions(api_client):
    response = api_client.get(HALKHATAS_URL)
    assert response.status_code == 401

    user = create_regular_user(username="regular-halkhata", password="regularpass123")
    api_client.force_login(user)
    token = _fetch_csrf(api_client)
    response = api_client.get(HALKHATAS_URL, HTTP_X_CSRFTOKEN=token)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_staff_user_can_manage_halkhata():
    client = APIClient()
    create_staff_user(username="staff1", password="staffpass123")
    _login(client, username_or_email="staff1", password="staffpass123")

    response = _auth_post_json(
        client,
        HALKHATAS_URL,
        _valid_halkhata_payload(title="Staff Halkhata"),
    )
    assert response.status_code == 201
