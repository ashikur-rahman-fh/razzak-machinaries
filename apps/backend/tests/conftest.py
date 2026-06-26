import pytest
from django.core.cache import cache
from rest_framework.settings import api_settings
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle


def _reload_drf_throttle_rates() -> None:
    api_settings.reload()
    SimpleRateThrottle.THROTTLE_RATES = api_settings.DEFAULT_THROTTLE_RATES


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def csrf_client():
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _reset_drf_throttle_rates():
    _reload_drf_throttle_rates()
    yield
    _reload_drf_throttle_rates()
