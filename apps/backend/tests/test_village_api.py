import json

import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from geo.cache import GEO_CACHE_VERSION_KEY
from geo.models import Village
from tests.test_admin_auth import (
    ADMIN_FORBIDDEN_CODE,
    _create_regular_user,
    _create_superuser,
    _fetch_csrf,
    _login,
)
from tests.test_api import assert_error_envelope

pytestmark = pytest.mark.django_db

VILLAGES_URL = "/api/admin/geo/villages/"
VILLAGES_IMPORT_URL = "/api/admin/geo/villages/import/"
PUBLIC_VILLAGES_URL = "/api/public/geo/villages/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


def _auth_get(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.get(url, HTTP_X_CSRFTOKEN=token)


def _auth_post_multipart(client: APIClient, url: str, data, *, query: str = ""):
    token = _fetch_csrf(client)
    return client.post(f"{url}{query}", data, format="multipart", HTTP_X_CSRFTOKEN=token)


def _phpmyadmin_villages_payload(rows: list[dict]) -> bytes:
    return json.dumps(
        [
            {"type": "header"},
            {"type": "database", "name": "bd_geo_code"},
            {"type": "table", "name": "villages", "database": "bd_geo_code", "data": rows},
        ]
    ).encode("utf-8")


def test_admin_villages_list_unauthenticated(api_client):
    response = api_client.get(VILLAGES_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_admin_villages_list_forbidden_for_regular_user(api_client):
    user = _create_regular_user()
    api_client.force_login(user)
    response = _auth_get(api_client, VILLAGES_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_admin_villages_crud_and_search(superuser_client):
    Village.objects.create(id=1, name_en="Balarampur", name_bn="বলরামপুর")
    Village.objects.create(id=2, name_en="Other", name_bn="অন্য")

    list_response = _auth_get(superuser_client, f"{VILLAGES_URL}?search=Balaram")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["count"] == 1
    assert body["results"][0]["nameEn"] == "Balarampur"

    detail_response = _auth_get(superuser_client, f"{VILLAGES_URL}1/")
    assert detail_response.status_code == 200
    assert detail_response.json()["nameBn"] == "বলরামপুর"


def test_admin_village_import_dry_run(superuser_client):
    payload = _phpmyadmin_villages_payload([{"id": "1", "name": "Balarampur", "bn_name": "বলরামপুর"}])
    upload = SimpleUploadedFile("villages.json", payload, content_type="application/json")
    response = _auth_post_multipart(
        superuser_client,
        VILLAGES_IMPORT_URL,
        {"file": upload},
        query="?dryRun=true",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["wouldCreate"] == 1
    assert Village.objects.count() == 0


def test_admin_village_import_commit(superuser_client):
    cache.set(GEO_CACHE_VERSION_KEY, 1)
    payload = _phpmyadmin_villages_payload([{"id": "1", "name": "Balarampur", "bn_name": "বলরামপুর"}])
    upload = SimpleUploadedFile("villages.json", payload, content_type="application/json")
    response = _auth_post_multipart(superuser_client, VILLAGES_IMPORT_URL, {"file": upload})
    assert response.status_code == 200
    assert Village.objects.filter(pk=1).exists()
    assert cache.get(GEO_CACHE_VERSION_KEY) == 2


def test_admin_village_import_invalid_file(superuser_client):
    upload = SimpleUploadedFile("bad.json", b"{invalid", content_type="application/json")
    response = _auth_post_multipart(
        superuser_client,
        VILLAGES_IMPORT_URL,
        {"file": upload},
        query="?dryRun=true",
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_public_villages_paginated(api_client):
    Village.objects.create(id=1, name_en="Balarampur", name_bn="বলরামপুর")
    Village.objects.create(id=2, name_en="Other", name_bn="অন্য")

    response = api_client.get(f"{PUBLIC_VILLAGES_URL}?pageSize=1")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert len(body["results"]) == 1
    assert body["results"][0]["nameEn"] == "Balarampur"
