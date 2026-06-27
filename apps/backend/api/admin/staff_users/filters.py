from django.db.models import Q

STAFF_USER_ORDERING_FIELDS = {
    "username": "username",
    "-username": "-username",
    "firstName": "first_name",
    "-firstName": "-first_name",
    "lastName": "last_name",
    "-lastName": "-last_name",
    "email": "email",
    "-email": "-email",
    "createdAt": "staff_profile__created_at",
    "-createdAt": "-staff_profile__created_at",
}

DEFAULT_STAFF_USER_ORDERING = "-staff_profile__created_at"
VALID_STAFF_USER_ORDERING = frozenset(STAFF_USER_ORDERING_FIELDS.keys())


def apply_staff_user_search(queryset, search: str | None):
    if not search or not search.strip():
        return queryset
    needle = search.strip()
    return queryset.filter(
        Q(username__icontains=needle)
        | Q(first_name__icontains=needle)
        | Q(last_name__icontains=needle)
        | Q(email__icontains=needle)
        | Q(staff_profile__phone__icontains=needle)
    )


def apply_staff_user_status_filter(queryset, status: str | None):
    normalized = (status or "").strip().lower()
    if normalized == "active":
        return queryset.filter(is_active=True)
    if normalized == "inactive":
        return queryset.filter(is_active=False)
    return queryset


def apply_staff_user_ordering(queryset, ordering: str | None):
    if ordering and ordering in VALID_STAFF_USER_ORDERING:
        return queryset.order_by(STAFF_USER_ORDERING_FIELDS[ordering])
    return queryset.order_by(DEFAULT_STAFF_USER_ORDERING)
