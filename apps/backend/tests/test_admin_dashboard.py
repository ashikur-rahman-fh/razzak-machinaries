from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from tests.factories import create_regular_user, create_superuser
from tests.test_admin_auth import _login
from tests.test_admin_customers import _auth_get, _auth_post_json, _create_customer
from tests.test_admin_transactions import (
    _initial_payload,
    _payment_payload,
    _sale_payload,
)
from tests.test_api import assert_error_envelope
from transactions.models import Transaction
from transactions.services import calculate_global_due

User = get_user_model()

pytestmark = pytest.mark.django_db

DASHBOARD_URL = "/api/admin/dashboard/"


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


@pytest.fixture
def second_customer():
    return _create_customer(
        full_name_en="Second Customer",
        full_name_bn="দ্বিতীয় গ্রাহক",
        phone="+8801700000002",
        phone_en="01700000002",
        phone_bn="০১৭০০০০০০০২",
    )


def _seed_dashboard_data(superuser_client, customer, second_customer):
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(customer.id, "1000.00", date="2025-06-01"),
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _sale_payload(
            customer.id,
            date="2026-01-10",
            items=[{"productName": "Part", "unitPrice": "500.00", "quantity": "2"}],
        ),
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _payment_payload(customer.id, "200.00", date="2026-01-20"),
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _initial_payload(second_customer.id, "300.00", date="2026-02-01"),
    )
    _auth_post_json(
        superuser_client,
        "/api/admin/transactions/",
        _sale_payload(
            second_customer.id,
            date="2025-03-15",
            items=[{"productName": "Tool", "unitPrice": "100.00", "quantity": "1"}],
        ),
    )


@patch("dashboard.services.timezone.localdate")
def test_dashboard_summary_total_due(mock_localdate, superuser_client, customer, second_customer):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    response = _auth_get(superuser_client, DASHBOARD_URL)
    assert response.status_code == 200

    expected_due = calculate_global_due()
    assert Decimal(response.data["summary"]["totalDue"]) == expected_due


@patch("dashboard.services.timezone.localdate")
def test_dashboard_current_month_sales_and_payments(
    mock_localdate, superuser_client, customer, second_customer
):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    response = _auth_get(superuser_client, DASHBOARD_URL)
    summary = response.data["summary"]

    assert Decimal(summary["currentMonthSales"]) == Decimal("1000.00")
    assert Decimal(summary["currentMonthPayments"]) == Decimal("200.00")
    assert Decimal(summary["currentMonthNetDueChange"]) == Decimal("800.00")


@patch("dashboard.services.timezone.localdate")
def test_dashboard_recent_transactions_ordered_by_updated_at(
    mock_localdate, superuser_client, customer, second_customer
):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    oldest = Transaction.objects.order_by("id").first()
    assert oldest is not None
    oldest.note = "touched"
    oldest.save()

    response = _auth_get(superuser_client, DASHBOARD_URL)
    recent = response.data["recentTransactions"]
    assert len(recent) == Transaction.objects.count()
    assert recent[0]["id"] == oldest.id
    assert recent[0]["displayId"] == f"COM-{oldest.id}"


@patch("dashboard.services.timezone.localdate")
def test_dashboard_recent_customers_ordered_by_updated_at(
    mock_localdate, superuser_client, customer, second_customer
):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    customer.memo_page_number_en = "updated"
    customer.save()

    response = _auth_get(superuser_client, DASHBOARD_URL)
    recent = response.data["recentCustomers"]
    assert recent[0]["id"] == customer.id


@patch("dashboard.services.timezone.localdate")
def test_dashboard_yearly_monthly_aggregation(
    mock_localdate, superuser_client, customer, second_customer
):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    response = _auth_get(superuser_client, f"{DASHBOARD_URL}?year=2026")
    yearly = response.data["yearlyStats"]

    assert yearly["year"] == 2026
    assert len(yearly["monthlySalesPayments"]) == 12
    assert len(yearly["monthlyDueChange"]) == 12
    assert len(yearly["monthlyTransactionCounts"]) == 12

    january = yearly["monthlySalesPayments"][0]
    assert january["month"] == 1
    assert Decimal(january["sales"]) == Decimal("1000.00")
    assert Decimal(january["payments"]) == Decimal("200.00")

    february = yearly["monthlySalesPayments"][1]
    assert Decimal(february["sales"]) == Decimal("0")
    assert Decimal(february["payments"]) == Decimal("0")

    march_2025 = _auth_get(superuser_client, f"{DASHBOARD_URL}?year=2025")
    march_data = march_2025.data["yearlyStats"]["monthlySalesPayments"][2]
    assert Decimal(march_data["sales"]) == Decimal("100.00")


@patch("dashboard.services.timezone.localdate")
def test_dashboard_year_param_does_not_change_current_month_summary(
    mock_localdate, superuser_client, customer, second_customer
):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    response_2025 = _auth_get(superuser_client, f"{DASHBOARD_URL}?year=2025")
    response_2026 = _auth_get(superuser_client, f"{DASHBOARD_URL}?year=2026")

    assert response_2025.data["summary"] == response_2026.data["summary"]
    assert response_2025.data["yearlyStats"]["year"] == 2025
    assert response_2026.data["yearlyStats"]["year"] == 2026


def test_dashboard_requires_authentication(api_client):
    response = api_client.get(DASHBOARD_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_dashboard_forbidden_for_non_superuser(api_client):
    user = create_regular_user(username="staff", password="staffpass123")
    api_client.force_login(user)
    response = _auth_get(api_client, DASHBOARD_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


@patch("dashboard.services.timezone.localdate")
def test_dashboard_counts(mock_localdate, superuser_client, customer, second_customer):
    mock_localdate.return_value = date(2026, 1, 25)
    _seed_dashboard_data(superuser_client, customer, second_customer)

    response = _auth_get(superuser_client, DASHBOARD_URL)
    summary = response.data["summary"]
    assert summary["totalCustomers"] == 2
    assert summary["totalTransactions"] == Transaction.objects.count()
