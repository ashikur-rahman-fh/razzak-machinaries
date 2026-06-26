from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from customers.models import CustomerVersion
from tests.test_admin_auth import (
    ADMIN_FORBIDDEN_CODE,
    _create_staff_user,
    _create_superuser,
    _login,
)
from tests.test_admin_customers import _auth_get, _auth_post_json, _create_customer
from tests.test_api import assert_error_envelope
from transactions.models import Transaction, TransactionItem, TransactionStatus
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
def staff_client(api_client):
    _create_staff_user()
    _login(api_client, username_or_email="staff", password="staffpass123")
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
        "items": [
            {"productName": "Tractor", "unitPrice": "1000", "quantity": "2"},
        ],
    }
    payload.update(overrides)
    return payload


def _payment_payload(customer_id: int, amount: str = "300", **overrides):
    payload = {
        "customerId": customer_id,
        "transactionType": "PAYMENT",
        "date": "2026-02-01",
        "amount": amount,
        "paymentMethod": "cash",
    }
    payload.update(overrides)
    return payload


def test_correction_creates_new_transaction_row(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]

    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected opening balance"},
    )
    assert correction_response.status_code == 201
    new_id = correction_response.data["newTransaction"]["id"]
    assert new_id != original_id
    assert Transaction.objects.filter(pk=original_id).exists()


def test_old_transaction_becomes_superseded(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    old = Transaction.objects.get(pk=original_id)
    assert old.status == TransactionStatus.SUPERSEDED
    assert old.is_current is False


def test_new_transaction_is_active_current(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new = Transaction.objects.get(pk=correction_response.data["newTransaction"]["id"])
    assert new.status == TransactionStatus.ACTIVE
    assert new.is_current is True
    assert new.version_number == 2
    assert new.previous_version_id == original_id


def test_transaction_history_returns_both_versions(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new_id = correction_response.data["newTransaction"]["id"]
    history_response = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{new_id}/history/")
    assert history_response.status_code == 200
    assert len(history_response.data["versions"]) == 2


def test_balance_uses_only_new_active_version(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    balance = calculate_customer_balance(customer.id)
    assert balance.current_balance == Decimal("700.00")


def test_void_excludes_entire_chain_from_balance(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new_id = correction_response.data["newTransaction"]["id"]
    void_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{new_id}/void/",
        {"voidReason": "Duplicate entry"},
    )
    assert void_response.status_code == 200
    balance = calculate_customer_balance(customer.id)
    assert balance.current_balance == Decimal("0.00")


def test_retrieve_voided_transaction_returns_200(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    transaction_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{transaction_id}/void/",
        {"voidReason": "Mistake"},
    )
    detail = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{transaction_id}/")
    assert detail.status_code == 200
    assert detail.data["status"] == "VOIDED"


def test_retrieve_superseded_transaction_returns_200(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    detail = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{original_id}/")
    assert detail.status_code == 200
    assert detail.data["status"] == "SUPERSEDED"


def test_void_does_not_restore_old_version(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new_id = correction_response.data["newTransaction"]["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{new_id}/void/",
        {"voidReason": "Duplicate"},
    )
    old = Transaction.objects.get(pk=original_id)
    assert old.status == TransactionStatus.SUPERSEDED
    assert old.is_current is False


def test_no_restore_endpoint(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    response = superuser_client.post(
        f"{TRANSACTIONS_URL}{original_id}/restore/",
        {},
        format="json",
    )
    assert response.status_code == 404


def test_sale_correction_preserves_old_items(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id)
    )
    original_id = create_response.data["id"]
    old_item_count = TransactionItem.objects.filter(transaction_id=original_id).count()
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {
            "items": [{"productName": "Plow", "unitPrice": "500", "quantity": "1"}],
            "editReason": "Wrong product",
        },
    )
    new_id = correction_response.data["newTransaction"]["id"]
    assert TransactionItem.objects.filter(transaction_id=original_id).count() == old_item_count
    assert TransactionItem.objects.filter(transaction_id=new_id).count() == 1


def test_confirmation_uses_transaction_snapshot(superuser_client, customer):
    create_response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _sale_payload(customer.id)
    )
    transaction_id = create_response.data["id"]
    customers_url = "/api/admin/customers/"
    _auth_post_json(
        superuser_client,
        f"{customers_url}{customer.id}/create-version/",
        {
            "fullNameBn": "নতুন নাম",
            "fullNameEn": "New Name",
            "addressBn": customer.address_bn,
            "addressEn": customer.address_en,
            "phoneBn": customer.phone_bn,
            "phoneEn": customer.phone_en,
            "fatherNameBn": customer.father_name_bn,
            "fatherNameEn": customer.father_name_en,
            "memoPageNumberBn": customer.memo_page_number_bn,
            "memoPageNumberEn": customer.memo_page_number_en,
            "changeReason": "Rename",
        },
    )
    confirmation = _auth_get(superuser_client, f"{TRANSACTIONS_URL}{transaction_id}/confirmation/")
    assert confirmation.data["customerNameEn"] != "New Name"
    assert confirmation.data["customerNameEn"] == "Ali"


def test_customer_version_created_on_edit(superuser_client):
    customer = _create_customer()
    response = _auth_post_json(
        superuser_client,
        f"/api/admin/customers/{customer.id}/create-version/",
        {
            "fullNameBn": "আলী",
            "fullNameEn": "Ali V2",
            "addressBn": customer.address_bn,
            "addressEn": customer.address_en,
            "phoneBn": customer.phone_bn,
            "phoneEn": customer.phone_en,
            "fatherNameBn": customer.father_name_bn,
            "fatherNameEn": customer.father_name_en,
            "memoPageNumberBn": customer.memo_page_number_bn,
            "memoPageNumberEn": customer.memo_page_number_en,
            "changeReason": "Updated name",
        },
    )
    assert response.status_code == 201
    assert CustomerVersion.objects.filter(customer=customer).count() == 2


def test_archived_customer_cannot_create_transaction(superuser_client, customer):
    _auth_post_json(
        superuser_client,
        f"/api/admin/customers/{customer.id}/archive/",
        {"archiveReason": "Inactive"},
    )
    response = _auth_post_json(
        superuser_client, TRANSACTIONS_URL, _initial_payload(customer.id, "100.00")
    )
    assert response.status_code == 400


def test_transaction_history_forbidden_for_staff(staff_client, customer):
    create_response = _auth_post_json(
        staff_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    transaction_id = create_response.data["id"]
    response = _auth_get(staff_client, f"{TRANSACTIONS_URL}{transaction_id}/history/")
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_staff_transaction_detail_scrubs_version_fields(staff_client, customer):
    create_response = _auth_post_json(
        staff_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        staff_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new_id = correction_response.data["newTransaction"]["id"]
    detail = _auth_get(staff_client, f"{TRANSACTIONS_URL}{new_id}/")
    assert detail.status_code == 200
    assert detail.data["id"] == new_id
    assert "versionNumber" not in detail.data
    assert "previousVersionId" not in detail.data
    assert "editReason" not in detail.data


def test_staff_retrieve_superseded_resolves_to_latest(staff_client, customer):
    create_response = _auth_post_json(
        staff_client, TRANSACTIONS_URL, _initial_payload(customer.id, "500.00")
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        staff_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "700.00", "editReason": "Corrected"},
    )
    new_id = correction_response.data["newTransaction"]["id"]
    detail = _auth_get(staff_client, f"{TRANSACTIONS_URL}{original_id}/")
    assert detail.status_code == 200
    assert detail.data["id"] == new_id
    assert detail.data["totalAmount"] == "700.00"
