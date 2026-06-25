from django.db.models import Q

from api.db.bilingual_search import (
    bilingual_icontains,
    bilingual_icontains_q,
    expand_bilingual_search_terms,
)


class DummyQuerySet:
    def __init__(self):
        self.filters = []

    def filter(self, condition):
        self.filters.append(condition)
        return self


def _lookup_values(condition: Q) -> set[tuple[str, str]]:
    return {(child[0], child[1]) for child in condition.children}


def test_expand_bilingual_search_terms_includes_digit_script_variants():
    assert expand_bilingual_search_terms("456") == ["456", "৪৫৬"]
    assert expand_bilingual_search_terms("৪৫৬") == ["৪৫৬", "456"]


def test_expand_bilingual_search_terms_keeps_text_unchanged():
    assert expand_bilingual_search_terms("rahim") == ["rahim"]
    assert expand_bilingual_search_terms("রহিম") == ["রহিম"]


def test_bilingual_icontains_builds_or_query_for_each_base():
    queryset = DummyQuerySet()
    bilingual_icontains(queryset, "tractor", "title", "description")

    assert len(queryset.filters) == 1
    condition = queryset.filters[0]
    assert isinstance(condition, Q)
    assert _lookup_values(condition) == {
        ("title_en__icontains", "tractor"),
        ("title_bn__icontains", "tractor"),
        ("description_en__icontains", "tractor"),
        ("description_bn__icontains", "tractor"),
    }


def test_bilingual_icontains_q_searches_both_locales_for_digit_variants():
    condition = bilingual_icontains_q("456", "memo_page_number")
    assert ("memo_page_number_en__icontains", "456") in _lookup_values(condition)
    assert ("memo_page_number_bn__icontains", "456") in _lookup_values(condition)
    assert ("memo_page_number_bn__icontains", "৪৫৬") in _lookup_values(condition)
    assert ("memo_page_number_en__icontains", "৪৫৬") in _lookup_values(condition)


def test_bilingual_icontains_trims_whitespace_in_filters():
    queryset = DummyQuerySet()
    bilingual_icontains(queryset, "  tractor  ", "title")

    condition = queryset.filters[0]
    assert _lookup_values(condition) == {
        ("title_en__icontains", "tractor"),
        ("title_bn__icontains", "tractor"),
    }


def test_bilingual_icontains_returns_queryset_unchanged_for_blank_query():
    queryset = DummyQuerySet()
    result = bilingual_icontains(queryset, "   ", "title")
    assert result is queryset
    assert queryset.filters == []
