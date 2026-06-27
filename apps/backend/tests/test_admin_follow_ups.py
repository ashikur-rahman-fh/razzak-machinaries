from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from customers.services import archive_customer
from follow_ups.models import CustomerFollowUp, FollowUpStatus
from tests.factories import create_regular_user, create_staff_user, create_superuser
from tests.test_admin_auth import _login
from tests.test_admin_customers import (
    _auth_get,
    _auth_patch_json,
    _auth_post_json,
    _create_customer,
)
from tests.test_admin_transactions import _initial_payload, _payment_payload, _sale_payload
from tests.test_api import assert_error_envelope
from transactions.services import calculate_customer_balance

pytestmark = pytest.mark.django_db

FOLLOW_UPS_URL = "/api/admin/follow-ups/"
DASHBOARD_FOLLOW_UPS_URL = "/api/admin/dashboard/follow-ups/"


def _customer_follow_ups_url(customer_id: int) -> str:
    return f"/api/admin/customers/{customer_id}/follow-ups/"


def _follow_up_detail_url(follow_up_id: int) -> str:
    return f"{FOLLOW_UPS_URL}{follow_up_id}/"


def _follow_up_complete_url(follow_up_id: int) -> str:
    return f"{FOLLOW_UPS_URL}{follow_up_id}/complete/"


def _follow_up_cancel_url(follow_up_id: int) -> str:
    return f"{FOLLOW_UPS_URL}{follow_up_id}/cancel/"


def _valid_follow_up_payload(**overrides):
    payload = {
        "followUpDate": "2026-06-26",
        "note": "Call about payment",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


@pytest.fixture
def staff_client(api_client):
    create_staff_user()
    _login(api_client, username_or_email="staff", password="staffpass123")
    return api_client


@pytest.fixture
def customer():
    return _create_customer()


@patch("follow_ups.services.timezone.localdate")
def test_create_follow_up(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    response = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    assert response.status_code == 201
    assert response.data["status"] == "pending"
    assert response.data["followUpDate"] == "2026-06-26"
    assert response.data["note"] == "Call about payment"
    assert (
        CustomerFollowUp.objects.filter(customer=customer, status=FollowUpStatus.PENDING).count()
        == 1
    )


@patch("follow_ups.services.timezone.localdate")
def test_get_customer_follow_ups(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26"),
    )
    response = _auth_get(superuser_client, _customer_follow_ups_url(customer.id))
    assert response.status_code == 200
    assert response.data["active"]["followUpDate"] == "2026-06-26"
    assert response.data["history"] == []


@patch("follow_ups.services.timezone.localdate")
def test_create_while_pending_reschedules_and_preserves_history(
    mock_localdate, superuser_client, customer
):
    mock_localdate.return_value = date(2026, 6, 26)
    first = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26", note="First"),
    )
    assert first.status_code == 201
    first_id = first.data["id"]

    second = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-30", note="Second"),
    )
    assert second.status_code == 201
    assert second.data["followUpDate"] == "2026-06-30"
    assert second.data["rescheduledFromId"] == first_id

    first_record = CustomerFollowUp.objects.get(pk=first_id)
    assert first_record.status == FollowUpStatus.RESCHEDULED

    response = _auth_get(superuser_client, _customer_follow_ups_url(customer.id))
    assert response.data["active"]["id"] == second.data["id"]
    assert len(response.data["history"]) == 1
    assert response.data["history"][0]["status"] == "rescheduled"


@patch("follow_ups.services.timezone.localdate")
def test_patch_reschedule_preserves_history(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    created = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26"),
    )
    follow_up_id = created.data["id"]

    response = _auth_patch_json(
        superuser_client,
        _follow_up_detail_url(follow_up_id),
        {"followUpDate": "2026-07-01", "note": "Moved"},
    )
    assert response.status_code == 200
    assert response.data["followUpDate"] == "2026-07-01"
    assert response.data["rescheduledFromId"] == follow_up_id

    old = CustomerFollowUp.objects.get(pk=follow_up_id)
    assert old.status == FollowUpStatus.RESCHEDULED


@patch("follow_ups.services.timezone.localdate")
def test_complete_follow_up(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    created = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    follow_up_id = created.data["id"]

    response = _auth_post_json(
        superuser_client,
        _follow_up_complete_url(follow_up_id),
        {"completionNote": "Customer paid partial amount"},
    )
    assert response.status_code == 200
    assert response.data["status"] == "completed"
    assert response.data["completionNote"] == "Customer paid partial amount"
    assert response.data["completedByName"] == "admin"
    assert response.data["completedAt"] is not None


@patch("follow_ups.services.timezone.localdate")
def test_cannot_complete_already_completed(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    created = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    follow_up_id = created.data["id"]
    _auth_post_json(superuser_client, _follow_up_complete_url(follow_up_id), {})

    response = _auth_post_json(superuser_client, _follow_up_complete_url(follow_up_id), {})
    assert_error_envelope(response, status_code=400, code="FOLLOW_UP_NOT_ACTIONABLE")


@patch("follow_ups.services.timezone.localdate")
def test_cancel_follow_up(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    created = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    follow_up_id = created.data["id"]

    response = _auth_post_json(superuser_client, _follow_up_cancel_url(follow_up_id), {})
    assert response.status_code == 200
    assert response.data["status"] == "cancelled"


@patch("follow_ups.services.timezone.localdate")
def test_cannot_cancel_completed_follow_up(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    created = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    follow_up_id = created.data["id"]
    _auth_post_json(superuser_client, _follow_up_complete_url(follow_up_id), {})

    response = _auth_post_json(superuser_client, _follow_up_cancel_url(follow_up_id), {})
    assert_error_envelope(response, status_code=400, code="FOLLOW_UP_NOT_ACTIONABLE")


@patch("follow_ups.services.timezone.localdate")
def test_staff_rejects_past_date(mock_localdate, staff_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    response = _auth_post_json(
        staff_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-20"),
    )
    assert_error_envelope(response, status_code=400, code="INVALID_FOLLOW_UP_DATE")


@patch("follow_ups.services.timezone.localdate")
def test_superuser_allows_past_date(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    response = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-20"),
    )
    assert response.status_code == 201


@patch("follow_ups.services.timezone.localdate")
def test_archived_customer_blocked(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    archive_customer(customer_id=customer.id, archive_reason="Moved away", archived_by=None)

    response = _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    assert_error_envelope(response, status_code=400, code="ARCHIVED_CUSTOMER_FOLLOW_UP")


@patch("follow_ups.services.timezone.localdate")
def test_dashboard_follow_ups_due_today_and_overdue(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    second_customer = _create_customer(full_name_en="Second Customer", phone_en="01722222222")

    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-20"),
    )
    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(second_customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26"),
    )
    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(
            _create_customer(full_name_en="Future Customer", phone_en="01733333333").id
        ),
        _valid_follow_up_payload(followUpDate="2026-06-30"),
    )

    response = _auth_get(superuser_client, DASHBOARD_FOLLOW_UPS_URL)
    assert response.status_code == 200
    assert len(response.data["items"]) == 2
    assert response.data["items"][0]["isOverdue"] is True
    assert response.data["items"][0]["isToday"] is False
    assert response.data["items"][0]["followUpDate"] == "2026-06-20"
    assert response.data["items"][1]["isOverdue"] is False
    assert response.data["items"][1]["isToday"] is True
    assert response.data["items"][1]["followUpDate"] == "2026-06-26"


@patch("follow_ups.services.timezone.localdate")
def test_get_customer_follow_ups_active_timing_flags(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26"),
    )
    response = _auth_get(superuser_client, _customer_follow_ups_url(customer.id))
    assert response.status_code == 200
    assert response.data["active"]["isOverdue"] is False
    assert response.data["active"]["isToday"] is True
    assert response.data["history"] == []


@patch("follow_ups.services.timezone.localdate")
def test_dashboard_follow_up_balance_accuracy(mock_localdate, superuser_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    transactions_url = "/api/admin/transactions/"
    _auth_post_json(superuser_client, transactions_url, _initial_payload(customer.id, "1000.00"))
    _auth_post_json(superuser_client, transactions_url, _sale_payload(customer.id))
    _auth_post_json(superuser_client, transactions_url, _payment_payload(customer.id, "300.00"))

    _auth_post_json(
        superuser_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(followUpDate="2026-06-26"),
    )

    response = _auth_get(superuser_client, DASHBOARD_FOLLOW_UPS_URL)
    assert response.status_code == 200
    expected = calculate_customer_balance(customer.id).current_balance
    assert Decimal(response.data["items"][0]["customer"]["currentBalance"]) == expected


def test_follow_ups_requires_auth(api_client, customer):
    response = api_client.get(_customer_follow_ups_url(customer.id))
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_follow_ups_forbidden_for_regular_user(api_client, customer):
    user = create_regular_user()
    api_client.force_login(user)
    response = _auth_get(api_client, _customer_follow_ups_url(customer.id))
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


@patch("follow_ups.services.timezone.localdate")
def test_follow_ups_allowed_for_staff(mock_localdate, staff_client, customer):
    mock_localdate.return_value = date(2026, 6, 26)
    response = _auth_post_json(
        staff_client,
        _customer_follow_ups_url(customer.id),
        _valid_follow_up_payload(),
    )
    assert response.status_code == 201
