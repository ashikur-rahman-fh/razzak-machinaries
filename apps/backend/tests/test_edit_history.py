import pytest
from rest_framework.test import APIClient

from tests.test_admin_auth import (
    ADMIN_FORBIDDEN_CODE,
    _create_staff_user,
    _create_superuser,
    _login,
)
from tests.test_admin_customers import (
    _auth_get,
    _auth_post_json,
    _create_customer,
)
from tests.test_api import assert_error_envelope
from tests.test_versioned_ledger import _initial_payload, _sale_payload

pytestmark = pytest.mark.django_db

EDIT_HISTORY_URL = "/api/admin/edit-history/"
TRANSACTIONS_URL = "/api/admin/transactions/"
CUSTOMERS_URL = "/api/admin/customers/"


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


def test_edit_history_empty(superuser_client):
    response = _auth_get(superuser_client, EDIT_HISTORY_URL)
    assert response.status_code == 200
    assert response.data["count"] == 0
    assert response.data["results"] == []


def test_edit_history_includes_transaction_void(superuser_client):
    customer = _create_customer()
    create_response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _initial_payload(customer.id, "100.00"),
    )
    transaction_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{transaction_id}/void/",
        {"voidReason": "Duplicate entry"},
    )

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?eventType=TRANSACTION_VOIDED")
    assert response.status_code == 200
    assert response.data["count"] == 1
    event = response.data["results"][0]
    assert event["eventType"] == "TRANSACTION_VOIDED"
    assert event["entityId"] == transaction_id
    assert event["transactionDisplayId"] == f"COM-{transaction_id}"
    assert event["reason"] == "Duplicate entry"


def test_edit_history_includes_transaction_correction(superuser_client):
    customer = _create_customer()
    create_response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _initial_payload(customer.id, "100.00"),
    )
    original_id = create_response.data["id"]
    correction_response = _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{original_id}/create-correction/",
        {"amount": "200.00", "editReason": "Fixed amount"},
    )
    new_id = correction_response.data["newTransaction"]["id"]

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?eventType=TRANSACTION_CORRECTED")
    assert response.status_code == 200
    assert response.data["count"] == 1
    event = response.data["results"][0]
    assert event["entityId"] == new_id
    assert event["reason"] == "Fixed amount"


def test_edit_history_includes_customer_edit(superuser_client):
    customer = _create_customer()
    _auth_post_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/create-version/",
        {
            "fullNameBn": customer.full_name_bn,
            "fullNameEn": "Updated Name",
            "addressBn": customer.address_bn,
            "addressEn": customer.address_en,
            "phoneBn": customer.phone_bn,
            "phoneEn": customer.phone_en,
            "fatherNameBn": customer.father_name_bn,
            "fatherNameEn": customer.father_name_en,
            "memoPageNumberBn": customer.memo_page_number_bn,
            "memoPageNumberEn": customer.memo_page_number_en,
            "changeReason": "Spelling fix",
        },
    )

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?eventType=CUSTOMER_EDITED")
    assert response.status_code == 200
    assert response.data["count"] == 1
    event = response.data["results"][0]
    assert event["entityId"] == customer.id
    assert event["entityLabelEn"] == "Updated Name"
    assert event["reason"] == "Spelling fix"


def test_edit_history_includes_customer_archive(superuser_client):
    customer = _create_customer()
    _auth_post_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/archive/",
        {"archiveReason": "Inactive account"},
    )

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?eventType=CUSTOMER_ARCHIVED")
    assert response.status_code == 200
    assert response.data["count"] == 1
    event = response.data["results"][0]
    assert event["entityId"] == customer.id
    assert event["status"] == "archived"
    assert event["reason"] == "Inactive account"


def test_edit_history_search_by_display_id(superuser_client):
    customer = _create_customer()
    create_response = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _sale_payload(customer.id),
    )
    transaction_id = create_response.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{transaction_id}/void/",
        {"voidReason": "Test void"},
    )

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?search=COM-{transaction_id}")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["entityId"] == transaction_id


def test_edit_history_sorted_newest_first(superuser_client):
    customer = _create_customer()
    first = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _initial_payload(customer.id, "50.00", date="2026-01-01"),
    )
    first_id = first.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{first_id}/void/",
        {"voidReason": "First void"},
    )
    second = _auth_post_json(
        superuser_client,
        TRANSACTIONS_URL,
        _initial_payload(customer.id, "75.00", date="2026-01-02"),
    )
    second_id = second.data["id"]
    _auth_post_json(
        superuser_client,
        f"{TRANSACTIONS_URL}{second_id}/void/",
        {"voidReason": "Second void"},
    )

    response = _auth_get(superuser_client, f"{EDIT_HISTORY_URL}?eventType=TRANSACTION_VOIDED")
    assert response.status_code == 200
    assert response.data["count"] == 2
    assert response.data["results"][0]["entityId"] == second_id


def test_edit_history_forbidden_for_staff(staff_client):
    response = _auth_get(staff_client, EDIT_HISTORY_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)
