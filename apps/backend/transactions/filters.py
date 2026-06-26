from django.db.models import Q

from transactions.models import TransactionType
from transactions.services import get_current_active_transactions


def apply_transaction_filters(
    queryset,
    *,
    customer_id=None,
    transaction_type=None,
    date_from=None,
    date_to=None,
    search=None,
    status=None,
    include_history=False,
):
    if not include_history:
        queryset = get_current_active_transactions(queryset)

    if customer_id is not None:
        queryset = queryset.filter(customer_id=customer_id)

    if transaction_type:
        queryset = queryset.filter(transaction_type=transaction_type)

    if status:
        queryset = queryset.filter(status=status)

    if date_from:
        queryset = queryset.filter(date__gte=date_from)

    if date_to:
        queryset = queryset.filter(date__lte=date_to)

    if search:
        search = search.strip()
        if search:
            queryset = queryset.filter(
                Q(note__icontains=search)
                | Q(items__product_name__icontains=search)
                | Q(customer__full_name_en__icontains=search)
                | Q(customer__full_name_bn__icontains=search)
                | Q(customer_name_en__icontains=search)
                | Q(customer_name_bn__icontains=search)
            ).distinct()

    return queryset


def apply_transaction_ordering(queryset, ordering: str | None):
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
    return queryset.order_by("-date", "-created_at", "-id")


def get_balance_impact(transaction_type: str, total_amount) -> str:
    if transaction_type == TransactionType.PAYMENT:
        return f"-{total_amount}"
    return f"+{total_amount}"
