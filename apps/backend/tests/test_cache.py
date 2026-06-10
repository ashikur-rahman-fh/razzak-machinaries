import pytest
from django.core.cache import cache

pytestmark = pytest.mark.django_db


def test_redis_cache_backend_configured():
    cache.set("razzak-machinaries:test", "value", timeout=5)
    assert cache.get("razzak-machinaries:test") == "value"
