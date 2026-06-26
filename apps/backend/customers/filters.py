from __future__ import annotations

from django.db.models import QuerySet
from rest_framework.exceptions import ValidationError

from customers.models import Customer
from customers.search_ranking import apply_ranked_customer_search

ORDERING_MAP = {
    "fullNameBn": "full_name_bn",
    "-fullNameBn": "-full_name_bn",
    "fullNameEn": "full_name_en",
    "-fullNameEn": "-full_name_en",
    "phone": "phone",
    "-phone": "-phone",
    "phoneBn": "phone_bn",
    "-phoneBn": "-phone_bn",
    "phoneEn": "phone_en",
    "-phoneEn": "-phone_en",
    "memoPageNumberBn": "memo_page_number_bn",
    "-memoPageNumberBn": "-memo_page_number_bn",
    "memoPageNumberEn": "memo_page_number_en",
    "-memoPageNumberEn": "-memo_page_number_en",
    "createdAt": "created_at",
    "-createdAt": "-created_at",
    "relevance": "-search_rank",
    "-relevance": "search_rank",
    "id": "id",
    "-id": "-id",
}

DEFAULT_ORDERING = "-created_at"
RELEVANCE_ORDERING = ("-search_rank", "-created_at")
EXPLICIT_SORT_KEYS = {
    "fullNameBn",
    "-fullNameBn",
    "fullNameEn",
    "-fullNameEn",
    "phone",
    "-phone",
    "phoneBn",
    "-phoneBn",
    "phoneEn",
    "-phoneEn",
    "memoPageNumberBn",
    "-memoPageNumberBn",
    "memoPageNumberEn",
    "-memoPageNumberEn",
    "createdAt",
    "-createdAt",
    "id",
    "-id",
}


def apply_customer_search(queryset: QuerySet[Customer], search: str | None) -> QuerySet[Customer]:
    return apply_ranked_customer_search(queryset, search)


def apply_customer_archive_filter(
    queryset: QuerySet[Customer], status: str | None
) -> QuerySet[Customer]:
    normalized = (status or "active").strip().lower()
    if normalized == "all":
        return queryset
    if normalized == "archived":
        return queryset.filter(is_archived=True)
    return queryset.filter(is_archived=False)


def _should_order_by_relevance(ordering: str | None, *, has_search: bool) -> bool:
    if not has_search:
        return False
    if not ordering or ordering == "-createdAt":
        return True
    return ordering in {"relevance", "-relevance"}


def apply_customer_ordering(
    queryset: QuerySet[Customer],
    ordering: str | None,
    *,
    has_search: bool = False,
):
    if ordering in {"relevance", "-relevance"} and not has_search:
        return queryset.order_by(DEFAULT_ORDERING)

    if _should_order_by_relevance(ordering, has_search=has_search):
        return queryset.order_by(*RELEVANCE_ORDERING)

    if has_search and ordering in EXPLICIT_SORT_KEYS:
        db_ordering = ORDERING_MAP.get(ordering)
        if db_ordering is None:
            raise ValidationError({"ordering": "Invalid ordering field."})
        return queryset.order_by(db_ordering)

    if not ordering:
        return queryset.order_by(DEFAULT_ORDERING)

    db_ordering = ORDERING_MAP.get(ordering)
    if db_ordering is None:
        raise ValidationError({"ordering": "Invalid ordering field."})
    return queryset.order_by(db_ordering)
