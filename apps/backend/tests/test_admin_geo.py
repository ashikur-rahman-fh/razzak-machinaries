import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from geo.cache import GEO_CACHE_VERSION_KEY, build_geo_cache_key
from geo.models import District, Division
from tests.factories import create_regular_user, create_superuser
from tests.test_admin_auth import _fetch_csrf, _login
from tests.test_api import assert_error_envelope

pytestmark = pytest.mark.django_db

DIVISIONS_URL = "/api/admin/geo/divisions/"
DISTRICTS_URL = "/api/admin/geo/districts/"
PUBLIC_DIVISIONS_URL = "/api/public/geo/divisions/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


def _auth_get(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.get(url, HTTP_X_CSRFTOKEN=token)


def _auth_post(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.post(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _auth_patch(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.patch(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _auth_delete(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.delete(url, HTTP_X_CSRFTOKEN=token)


def _seed_minimal_geo():
    division = Division.objects.create(id=1, name_en="Dhaka", name_bn="ঢাকা")
    District.objects.create(id=1, name_en="Dhaka", name_bn="ঢাকা", division=division)
    return division


def test_admin_geo_list_unauthenticated(api_client):
    response = api_client.get(DIVISIONS_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_admin_geo_list_forbidden_for_regular_user(api_client):
    user = create_regular_user()
    api_client.force_login(user)
    response = _auth_get(api_client, DIVISIONS_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_admin_geo_list_paginated(superuser_client):
    _seed_minimal_geo()
    Division.objects.create(id=2, name_en="Barisal", name_bn="বরিশাল")

    response = _auth_get(superuser_client, f"{DIVISIONS_URL}?pageSize=1")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert len(body["results"]) == 1
    assert body["results"][0]["nameEn"] == "Barisal"
    assert "next" in body
    assert "previous" in body


def test_admin_geo_list_invalid_page_size(superuser_client):
    response = _auth_get(superuser_client, f"{DIVISIONS_URL}?pageSize=999")
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_admin_geo_districts_filter_by_division(superuser_client):
    division = _seed_minimal_geo()
    Division.objects.create(id=2, name_en="Sylhet", name_bn="সিলেট")
    District.objects.create(id=2, name_en="Sylhet", name_bn="সিলেট", division_id=2)

    response = _auth_get(superuser_client, f"{DISTRICTS_URL}?divisionId={division.pk}")
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["divisionId"] == division.pk


def test_admin_geo_search_matches_bangla(superuser_client):
    _seed_minimal_geo()

    response = _auth_get(superuser_client, f"{DIVISIONS_URL}?search=ঢাকা")
    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_admin_geo_create_auto_id(superuser_client):
    response = _auth_post(
        superuser_client,
        DIVISIONS_URL,
        {"nameEn": "Test Division", "nameBn": "টেস্ট"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["nameEn"] == "Test Division"


def test_admin_geo_create_explicit_id(superuser_client):
    response = _auth_post(
        superuser_client,
        DIVISIONS_URL,
        {"id": 42, "nameEn": "Explicit", "nameBn": "এক্সপ্লিসিট"},
    )
    assert response.status_code == 201
    assert response.json()["id"] == 42


def test_admin_geo_create_duplicate_id_conflict(superuser_client):
    Division.objects.create(id=5, name_en="Existing", name_bn="Existing")

    response = _auth_post(
        superuser_client,
        DIVISIONS_URL,
        {"id": 5, "nameEn": "Duplicate", "nameBn": "Duplicate"},
    )
    assert_error_envelope(response, status_code=409, code="GEO_ID_CONFLICT")


def test_admin_geo_create_district_requires_division(superuser_client):
    response = _auth_post(
        superuser_client,
        DISTRICTS_URL,
        {"nameEn": "No Parent", "nameBn": "No Parent"},
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_admin_geo_patch_updates_name(superuser_client):
    _seed_minimal_geo()

    response = _auth_patch(
        superuser_client,
        f"{DIVISIONS_URL}1/",
        {"nameEn": "Updated Dhaka"},
    )
    assert response.status_code == 200
    assert response.json()["nameEn"] == "Updated Dhaka"
    assert response.json()["nameBn"] == "ঢাকা"


def test_admin_geo_delete_success(superuser_client):
    Division.objects.create(id=99, name_en="Temporary", name_bn="Temporary")

    response = _auth_delete(superuser_client, f"{DIVISIONS_URL}99/")
    assert response.status_code == 204
    assert not Division.objects.filter(pk=99).exists()


def test_admin_geo_delete_with_children_conflict(superuser_client):
    _seed_minimal_geo()

    response = _auth_delete(superuser_client, f"{DIVISIONS_URL}1/")
    assert_error_envelope(response, status_code=409, code="GEO_HAS_CHILDREN")
    assert response.json()["error"]["details"]["childType"] == "district"


def test_admin_geo_write_bumps_public_cache(superuser_client):
    cache.set(GEO_CACHE_VERSION_KEY, 1, timeout=None)
    cache.set(
        build_geo_cache_key("divisions"),
        [{"id": 1, "nameEn": "Stale", "nameBn": "Stale"}],
        timeout=60,
    )

    _auth_post(
        superuser_client,
        DIVISIONS_URL,
        {"nameEn": "Fresh", "nameBn": "Fresh"},
    )

    assert cache.get(GEO_CACHE_VERSION_KEY) == 2

    public_response = superuser_client.get(PUBLIC_DIVISIONS_URL)
    assert public_response.status_code == 200
    assert public_response.json()[0]["nameEn"] == "Fresh"


def test_admin_geo_post_without_csrf_fails(csrf_client):
    create_superuser()
    _login(csrf_client, username_or_email="admin", password="adminpass123", with_csrf=True)

    response = csrf_client.post(
        DIVISIONS_URL,
        {"nameEn": "No CSRF", "nameBn": "No CSRF"},
        format="json",
    )
    assert response.status_code == 403


def test_admin_geo_patch_changes_district_parent(superuser_client):
    division = _seed_minimal_geo()
    other = Division.objects.create(id=2, name_en="Sylhet", name_bn="সিলেট")

    response = _auth_patch(
        superuser_client,
        f"{DISTRICTS_URL}1/",
        {"divisionId": other.pk},
    )
    assert response.status_code == 200
    assert response.json()["divisionId"] == other.pk
    assert District.objects.get(pk=1).division_id == other.pk
    assert division.pk == 1
