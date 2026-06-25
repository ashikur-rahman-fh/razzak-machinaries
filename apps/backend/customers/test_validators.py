import pytest

from customers.validators import normalize_phone_search_term

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    ("raw", "expected_subset"),
    [
        ("01712345678", ["01712345678", "1712345678", "8801712345678", "+8801712345678"]),
        ("+8801712345678", ["+8801712345678", "1712345678", "01712345678"]),
        ("8801712345678", ["8801712345678", "1712345678", "01712345678"]),
        ("০১৭১২৩৪৫৬৭৮", ["01712345678", "1712345678"]),
    ],
)
def test_normalize_phone_search_term_variants(raw, expected_subset):
    variants = normalize_phone_search_term(raw)
    for expected in expected_subset:
        assert expected in variants


def test_normalize_phone_search_term_empty():
    assert normalize_phone_search_term("") == []
    assert normalize_phone_search_term("   ") == []


def test_normalize_phone_search_term_strips_formatting():
    variants = normalize_phone_search_term("(017) 1234-5678")
    assert "01712345678" in variants
