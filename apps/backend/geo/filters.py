from rest_framework.exceptions import ValidationError

from api.db.bilingual_search import bilingual_icontains

ORDERING_MAP = {
    "nameEn": "name_en",
    "-nameEn": "-name_en",
    "nameBn": "name_bn",
    "-nameBn": "-name_bn",
    "id": "id",
    "-id": "-id",
}

DEFAULT_ORDERING = "name_en"


def apply_geo_search(queryset, search: str | None):
    if not search:
        return queryset
    return bilingual_icontains(queryset, search, "name")


def apply_geo_ordering(queryset, ordering: str | None):
    if not ordering:
        return queryset.order_by(DEFAULT_ORDERING)

    db_ordering = ORDERING_MAP.get(ordering)
    if db_ordering is None:
        raise ValidationError({"ordering": "Invalid ordering field."})
    return queryset.order_by(db_ordering)


def apply_parent_filter(
    queryset,
    *,
    param_value: str | None,
    param_name: str,
    filter_field: str,
):
    if param_value is None or param_value == "":
        return queryset

    try:
        parsed = int(param_value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({param_name: "Must be a valid integer."}) from exc

    if parsed <= 0:
        raise ValidationError({param_name: "Must be a positive integer."})

    return queryset.filter(**{filter_field: parsed})
