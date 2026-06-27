from django.db.models import Q

from halkhata.models import HalkhataStatus


def apply_halkhata_status_filter(queryset, status: str | None):
    normalized = (status or "").strip().lower()
    if normalized == HalkhataStatus.ACTIVE:
        return queryset.filter(status=HalkhataStatus.ACTIVE)
    if normalized == HalkhataStatus.CLOSED:
        return queryset.filter(status=HalkhataStatus.CLOSED)
    return queryset


def apply_halkhata_transaction_filters(
    queryset,
    *,
    search: str | None = None,
):
    if search:
        search = search.strip()
        if search:
            queryset = queryset.filter(
                Q(note__icontains=search)
                | Q(customer__full_name_en__icontains=search)
                | Q(customer__full_name_bn__icontains=search)
                | Q(customer_name_en__icontains=search)
                | Q(customer_name_bn__icontains=search)
                | Q(customer_phone__icontains=search)
            ).distinct()
    return queryset


def apply_halkhata_transaction_ordering(queryset, ordering: str | None):
    allowed = {
        "date": "date",
        "-date": "-date",
        "createdAt": "created_at",
        "-createdAt": "-created_at",
        "totalAmount": "total_amount",
        "-totalAmount": "-total_amount",
    }
    if ordering and ordering in allowed:
        return queryset.order_by(allowed[ordering], "-id")
    return queryset.order_by("-created_at", "-id")
