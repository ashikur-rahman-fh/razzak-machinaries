from django.db.models import Q

from api.db.bilingual_search import bilingual_icontains


class DummyQuerySet:
    def __init__(self):
        self.filters = []

    def filter(self, condition):
        self.filters.append(condition)
        return self


def _lookup_values(condition: Q) -> set[tuple[str, str]]:
    return {(child[0], child[1]) for child in condition.children}


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
