from unittest.mock import MagicMock, patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from api.admin.constants import ADMIN_FORBIDDEN_CODE
from tests.factories import create_regular_user, create_superuser
from tests.test_admin_auth import _fetch_csrf, _login
from tests.test_api import assert_error_envelope

pytestmark = pytest.mark.django_db

TRANSLATIONS_URL = "/api/admin/translations/"


@pytest.fixture(autouse=True)
def azure_translation_env(monkeypatch):
    monkeypatch.setenv("TRANSLATION_PROVIDER", "azure")
    monkeypatch.setenv("AZURE_TRANSLATOR_ENDPOINT", "https://example.cognitiveservices.azure.com")
    monkeypatch.setenv("AZURE_TRANSLATOR_KEY", "test-key")
    monkeypatch.setenv("AZURE_TRANSLATOR_REGION", "eastus")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


def _auth_post_json(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.post(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _azure_success_body(text: str) -> bytes:
    import json

    return json.dumps([{"translations": [{"text": text, "to": "en"}]}]).encode("utf-8")


@patch("api.services.translation.providers.azure.urllib.request.urlopen")
def test_translate_bn_to_en_success(mock_urlopen, superuser_client):
    mock_response = MagicMock()
    mock_response.read.return_value = _azure_success_body("Hello")
    mock_response.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_response

    response = _auth_post_json(
        superuser_client,
        TRANSLATIONS_URL,
        {"text": "হ্যালো", "source": "bn", "target": "en"},
    )

    assert response.status_code == 200
    assert response.data == {"translatedText": "Hello", "provider": "azure"}


@patch("api.services.translation.providers.azure.urllib.request.urlopen")
def test_translate_uses_cache(mock_urlopen, superuser_client):
    cache.clear()
    mock_response = MagicMock()
    mock_response.read.return_value = _azure_success_body("Cached result")
    mock_response.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_response

    payload = {"text": "টেস্ট", "source": "bn", "target": "en"}
    first = _auth_post_json(superuser_client, TRANSLATIONS_URL, payload)
    second = _auth_post_json(superuser_client, TRANSLATIONS_URL, payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.data["translatedText"] == "Cached result"
    assert second.data["provider"] == "azure"
    mock_urlopen.assert_called_once()


@patch("api.services.translation.providers.azure.urllib.request.urlopen")
def test_translate_provider_failure(mock_urlopen, superuser_client):
    import urllib.error

    mock_urlopen.side_effect = urllib.error.URLError("connection refused")

    response = _auth_post_json(
        superuser_client,
        TRANSLATIONS_URL,
        {"text": "হ্যালো", "source": "bn", "target": "en"},
    )

    assert response.status_code == 503
    assert_error_envelope(response, status_code=503, code="TRANSLATION_FAILED")


def test_translate_requires_auth(api_client):
    response = api_client.post(
        TRANSLATIONS_URL,
        {"text": "test", "source": "bn", "target": "en"},
        format="json",
    )
    assert response.status_code == 401


def test_translate_forbidden_for_non_superuser(api_client):
    user = create_regular_user(username="staff", password="staffpass123")
    api_client.force_login(user)
    token = _fetch_csrf(api_client)
    response = api_client.post(
        TRANSLATIONS_URL,
        {"text": "test", "source": "bn", "target": "en"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_translate_rejects_empty_text(superuser_client):
    response = _auth_post_json(
        superuser_client,
        TRANSLATIONS_URL,
        {"text": "   ", "source": "bn", "target": "en"},
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_translate_rejects_same_language(superuser_client):
    response = _auth_post_json(
        superuser_client,
        TRANSLATIONS_URL,
        {"text": "hello", "source": "en", "target": "en"},
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")
