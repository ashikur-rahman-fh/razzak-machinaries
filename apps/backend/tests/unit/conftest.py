import pytest


@pytest.fixture(autouse=True)
def _clear_cache():
    yield
