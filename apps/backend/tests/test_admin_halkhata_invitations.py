from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from halkhata.models import HalkhataInvitationGeneration
from tests.factories import create_regular_user, create_superuser
from tests.test_admin_auth import _fetch_csrf, _login
from tests.test_admin_customers import (
    _auth_get,
    _auth_post_json,
    _create_customer,
)
from tests.test_admin_halkhata import (
    _auth_patch_json,
    _halkhata_detail_url,
    _valid_halkhata_payload,
)
from tests.test_admin_halkhata import _auth_post_json as _auth_post_halkhata
from tests.test_api import assert_error_envelope

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


def _invitations_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/invitations/"


def _invitation_customers_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/invitations/customers/"


def _invitation_generations_url(halkhata_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/invitations/generations/"


def _invitation_generation_detail_url(halkhata_id: int, generation_id: int) -> str:
    return f"{HALKHATAS_URL}{halkhata_id}/invitations/generations/{generation_id}/"


def _create_halkhata(client) -> int:
    response = _auth_post_halkhata(client, HALKHATAS_URL, _valid_halkhata_payload())
    assert response.status_code == 201
    return response.json()["id"]


def test_invitations_page_context_requires_auth(api_client):
    response = api_client.get(_invitations_url(1))
    assert response.status_code == 401


def test_invitations_page_context_forbidden_for_regular_user(api_client):
    user = create_regular_user(username="regular-invite", password="regularpass123")
    api_client.force_login(user)
    token = _fetch_csrf(api_client)
    response = api_client.get(_invitations_url(1), HTTP_X_CSRFTOKEN=token)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_invitations_page_context(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    _create_customer(phone_en="01720000001")
    due_customer = _create_customer(phone_en="01720000002")
    due_customer.cached_balance = Decimal("300.00")
    due_customer.save(update_fields=["cached_balance"])

    response = _auth_get(superuser_client, _invitations_url(halkhata_id))
    assert response.status_code == 200
    body = response.json()
    assert body["halkhataId"] == halkhata_id
    assert body["canGenerate"] is True
    assert body["totalActiveCustomers"] >= 2
    assert body["totalDueCustomers"] >= 1


def test_invitation_customers_search_and_has_due(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    due_customer = _create_customer(
        phone_en="01720000003",
        full_name_en="Due Customer",
        address_bn="গ্রাম: চরপাড়া",
    )
    due_customer.cached_balance = Decimal("100.00")
    due_customer.save(update_fields=["cached_balance"])
    _create_customer(phone_en="01720000004", full_name_en="Paid Customer")

    response = _auth_get(
        superuser_client,
        f"{_invitation_customers_url(halkhata_id)}?search=Due&hasDue=true",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["id"] == due_customer.id


def test_create_invitation_generation_manual(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    customer = _create_customer(
        phone_en="01720000005",
        full_name_bn="রফিক",
        father_name_bn="করিম",
    )

    response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {
            "selectionMode": "manual",
            "customerIds": [customer.id],
            "notes": "Test batch",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["customerCount"] == 1
    assert body["customerSelectionMode"] == "manual"
    assert len(body["recipients"]) == 1
    assert body["recipients"][0]["customerNameSnapshot"] == "রফিক"
    assert body["recipients"][0]["fatherNameSnapshot"] == "করিম"


def test_create_invitation_generation_all_active(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    first = _create_customer(phone_en="01720000006")
    second = _create_customer(phone_en="01720000007")

    response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "all_active"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["customerCount"] >= 2
    recipient_ids = {item["customerId"] for item in body["recipients"]}
    assert first.id in recipient_ids
    assert second.id in recipient_ids


def test_create_invitation_generation_rejects_empty_manual(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": []},
    )
    assert response.status_code == 400


def test_closed_halkhata_blocks_generation_but_allows_print(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    customer = _create_customer(phone_en="01720000008")

    create_response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )
    assert create_response.status_code == 201
    generation_id = create_response.json()["id"]

    close_response = _auth_patch_json(
        superuser_client,
        _halkhata_detail_url(halkhata_id),
        {"status": "closed"},
    )
    assert close_response.status_code == 200

    blocked_response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )
    assert blocked_response.status_code == 400
    assert_error_envelope(blocked_response, status_code=400, code="HALKHATA_CLOSED")

    print_response = _auth_get(
        superuser_client,
        _invitation_generation_detail_url(halkhata_id, generation_id),
    )
    assert print_response.status_code == 200
    assert print_response.json()["id"] == generation_id


def test_regeneration_creates_new_record(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    customer = _create_customer(phone_en="01720000009")

    first = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )
    second = _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] != second.json()["id"]
    assert HalkhataInvitationGeneration.objects.filter(halkhata_id=halkhata_id).count() == 2


def test_generation_detail_wrong_halkhata_returns_404(superuser_client):
    first_halkhata = _create_halkhata(superuser_client)
    second_halkhata = _create_halkhata(superuser_client)
    customer = _create_customer(phone_en="01720000010")

    create_response = _auth_post_json(
        superuser_client,
        _invitation_generations_url(first_halkhata),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )
    generation_id = create_response.json()["id"]

    response = _auth_get(
        superuser_client,
        _invitation_generation_detail_url(second_halkhata, generation_id),
    )
    assert response.status_code == 404


def test_list_invitation_generations(superuser_client):
    halkhata_id = _create_halkhata(superuser_client)
    customer = _create_customer(phone_en="01720000011")
    _auth_post_json(
        superuser_client,
        _invitation_generations_url(halkhata_id),
        {"selectionMode": "manual", "customerIds": [customer.id]},
    )

    response = _auth_get(superuser_client, _invitation_generations_url(halkhata_id))
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["customerCount"] == 1
