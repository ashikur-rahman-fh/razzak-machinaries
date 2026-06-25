from __future__ import annotations

from django.db.models import Q
from rest_framework.exceptions import ValidationError

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
    "id": "id",
    "-id": "-id",
}

DEFAULT_ORDERING = "-created_at"


def apply_customer_search(queryset, search: str | None):
    normalized = (search or "").strip()
    if not normalized:
        return queryset

    return queryset.filter(
        Q(full_name_bn__icontains=normalized)
        | Q(full_name_en__icontains=normalized)
        | Q(phone__icontains=normalized)
        | Q(phone_bn__icontains=normalized)
        | Q(phone_en__icontains=normalized)
        | Q(memo_page_number_bn__icontains=normalized)
        | Q(memo_page_number_en__icontains=normalized)
    )


def apply_customer_ordering(queryset, ordering: str | None):
    if not ordering:
        return queryset.order_by(DEFAULT_ORDERING)

    db_ordering = ORDERING_MAP.get(ordering)
    if db_ordering is None:
        raise ValidationError({"ordering": "Invalid ordering field."})
    return queryset.order_by(db_ordering)
