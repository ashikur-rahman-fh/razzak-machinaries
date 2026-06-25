import pytest

from customers.models import Customer
from customers.search_ranking import (
    apply_ranked_customer_search,
    build_base_customer_search_filter,
    normalize_search_text,
)

pytestmark = pytest.mark.django_db


def _create_customer(**overrides):
    data = {
        "full_name_bn": "আলী",
        "full_name_en": "Ali",
        "address_bn": "ঠিকানা",
        "address_en": "Address",
        "phone_bn": "০১৭১১১১১১১১১",
        "phone_en": "01711111111",
        "phone": "+8801711111111",
        "father_name_bn": "বাবা",
        "father_name_en": "Father",
        "memo_page_number_bn": "১",
        "memo_page_number_en": "1",
    }
    data.update(overrides)
    return Customer.objects.create(**data)


def test_normalize_search_text_collapses_whitespace():
    assert normalize_search_text("  rahim   uddin  ") == "rahim uddin"


def test_build_customer_search_filter_finds_fuzzy_name():
    _create_customer(full_name_en="Rahim Uddin")
    matches = apply_ranked_customer_search(Customer.objects.all(), "raheem")
    assert matches.count() == 1


def test_build_customer_search_filter_finds_short_prefix():
    _create_customer(full_name_en="Rahim Uddin")
    matches = Customer.objects.filter(build_base_customer_search_filter("ra"))
    assert matches.count() == 1


def test_build_customer_search_filter_finds_fuzzy_address():
    _create_customer(address_en="Village: Charpara")
    matches = apply_ranked_customer_search(Customer.objects.all(), "charpar")
    assert matches.count() == 1


@pytest.mark.parametrize(
    ("search_term", "overrides"),
    [
        ("uddin", {"full_name_en": "Rahim Uddin"}),
        ("arpara", {"address_en": "Village Charpara, Dhaka"}),
        ("111111", {"phone": "+8801711111111", "phone_en": "01711111111"}),
        ("17111111", {"phone": "+8801711111111", "phone_en": "01711111111"}),
        ("Ali Khan", {"mediator_name_en": "Mediator Ali Khan"}),
        ("মাধ্য", {"mediator_name_bn": "মাধ্যম আলী"}),
    ],
)
def test_search_matches_middle_substrings(search_term, overrides):
    _create_customer(**overrides)
    matches = apply_ranked_customer_search(Customer.objects.all(), search_term)
    assert matches.count() == 1


def test_search_multi_token_matches_across_fields():
    _create_customer(
        full_name_en="Rahim Uddin",
        address_en="Village Charpara, Dhaka",
    )
    matches = apply_ranked_customer_search(Customer.objects.all(), "uddin charpara")
    assert matches.count() == 1


def test_search_multi_token_requires_all_tokens():
    _create_customer(
        full_name_en="Rahim Uddin",
        address_en="Village Charpara, Dhaka",
    )
    matches = apply_ranked_customer_search(Customer.objects.all(), "uddin chittagong")
    assert matches.count() == 0


@pytest.mark.parametrize(
    ("search_term", "overrides"),
    [
        ("456", {"memo_page_number_bn": "৪৫৬", "memo_page_number_en": ""}),
        ("৪৫৬", {"memo_page_number_bn": "", "memo_page_number_en": "456"}),
        ("রহিম", {"full_name_bn": "রহিম উদ্দিন", "full_name_en": "Rahim Uddin"}),
        ("rahim", {"full_name_bn": "রহিম উদ্দিন", "full_name_en": "Rahim Uddin"}),
        (
            "০১৭১১১",
            {"phone_bn": "০১৭১১১১১১১১১", "phone_en": "01711111111", "phone": "+8801711111111"},
        ),
        (
            "017111",
            {"phone_bn": "০১৭১১১১১১১১১", "phone_en": "01711111111", "phone": "+8801711111111"},
        ),
    ],
)
def test_search_matches_both_bangla_and_english_fields(search_term, overrides):
    _create_customer(**overrides)
    matches = apply_ranked_customer_search(Customer.objects.all(), search_term)
    assert matches.count() == 1
