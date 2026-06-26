from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal

from django.utils import timezone

from customers.models import Customer, CustomerVersion
from transactions.models import Transaction, TransactionStatus

EditHistoryEventType = Literal[
    "TRANSACTION_CORRECTED",
    "TRANSACTION_VOIDED",
    "CUSTOMER_EDITED",
    "CUSTOMER_ARCHIVED",
]

PER_SOURCE_CAP = 200

VALID_EVENT_TYPES = {
    "TRANSACTION_CORRECTED",
    "TRANSACTION_VOIDED",
    "CUSTOMER_EDITED",
    "CUSTOMER_ARCHIVED",
}


@dataclass(frozen=True)
class EditHistoryEvent:
    id: str
    event_type: EditHistoryEventType
    occurred_at: datetime
    actor_name: str | None
    reason: str | None
    entity_type: Literal["transaction", "customer"]
    entity_id: int
    entity_label_en: str
    entity_label_bn: str
    status: str | None
    customer_id: int | None
    transaction_display_id: str | None


def _username(user) -> str | None:
    if user is None:
        return None
    return user.get_username()


def _transaction_label_en(tx: Transaction) -> str:
    return (
        f"{tx.get_transaction_type_display()} — {tx.customer_name_en or tx.customer.full_name_en}"
    )


def _transaction_label_bn(tx: Transaction) -> str:
    return (
        f"{tx.get_transaction_type_display()} — {tx.customer_name_bn or tx.customer.full_name_bn}"
    )


def _collect_transaction_corrections() -> list[EditHistoryEvent]:
    queryset = (
        Transaction.objects.filter(version_number__gt=1)
        .select_related("customer", "edited_by")
        .order_by("-edited_at", "-created_at")[:PER_SOURCE_CAP]
    )
    events: list[EditHistoryEvent] = []
    for tx in queryset:
        occurred_at = tx.edited_at or tx.created_at
        events.append(
            EditHistoryEvent(
                id=f"tx-correct-{tx.pk}",
                event_type="TRANSACTION_CORRECTED",
                occurred_at=occurred_at,
                actor_name=_username(tx.edited_by),
                reason=tx.edit_reason or None,
                entity_type="transaction",
                entity_id=tx.pk,
                entity_label_en=_transaction_label_en(tx),
                entity_label_bn=_transaction_label_bn(tx),
                status=tx.status,
                customer_id=tx.customer_id,
                transaction_display_id=tx.display_id,
            )
        )
    return events


def _collect_transaction_voids() -> list[EditHistoryEvent]:
    queryset = (
        Transaction.objects.filter(status=TransactionStatus.VOIDED, voided_at__isnull=False)
        .select_related("customer", "voided_by")
        .order_by("-voided_at")[:PER_SOURCE_CAP]
    )
    events: list[EditHistoryEvent] = []
    for tx in queryset:
        events.append(
            EditHistoryEvent(
                id=f"tx-void-{tx.pk}",
                event_type="TRANSACTION_VOIDED",
                occurred_at=tx.voided_at,
                actor_name=_username(tx.voided_by),
                reason=tx.void_reason or None,
                entity_type="transaction",
                entity_id=tx.pk,
                entity_label_en=_transaction_label_en(tx),
                entity_label_bn=_transaction_label_bn(tx),
                status=tx.status,
                customer_id=tx.customer_id,
                transaction_display_id=tx.display_id,
            )
        )
    return events


def _collect_customer_edits() -> list[EditHistoryEvent]:
    queryset = (
        CustomerVersion.objects.filter(version_number__gt=1)
        .select_related("customer", "created_by")
        .order_by("-created_at")[:PER_SOURCE_CAP]
    )
    events: list[EditHistoryEvent] = []
    for version in queryset:
        events.append(
            EditHistoryEvent(
                id=f"customer-edit-{version.pk}",
                event_type="CUSTOMER_EDITED",
                occurred_at=version.created_at,
                actor_name=_username(version.created_by),
                reason=version.change_reason or None,
                entity_type="customer",
                entity_id=version.customer_id,
                entity_label_en=version.full_name_en,
                entity_label_bn=version.full_name_bn,
                status="ACTIVE",
                customer_id=version.customer_id,
                transaction_display_id=None,
            )
        )
    return events


def _collect_customer_archives() -> list[EditHistoryEvent]:
    queryset = (
        Customer.objects.filter(is_archived=True, archived_at__isnull=False)
        .select_related("archived_by")
        .order_by("-archived_at")[:PER_SOURCE_CAP]
    )
    events: list[EditHistoryEvent] = []
    for customer in queryset:
        events.append(
            EditHistoryEvent(
                id=f"customer-archive-{customer.pk}",
                event_type="CUSTOMER_ARCHIVED",
                occurred_at=customer.archived_at,
                actor_name=_username(customer.archived_by),
                reason=customer.archive_reason or None,
                entity_type="customer",
                entity_id=customer.pk,
                entity_label_en=customer.full_name_en,
                entity_label_bn=customer.full_name_bn,
                status="archived",
                customer_id=customer.pk,
                transaction_display_id=None,
            )
        )
    return events


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _matches_search(event: EditHistoryEvent, search: str) -> bool:
    needle = search.strip().lower()
    if not needle:
        return True
    haystacks = [
        event.entity_label_en,
        event.entity_label_bn,
        event.reason or "",
        event.transaction_display_id or "",
        event.actor_name or "",
    ]
    return any(needle in value.lower() for value in haystacks if value)


def _matches_date_range(
    event: EditHistoryEvent,
    *,
    date_from: date | None,
    date_to: date | None,
) -> bool:
    occurred_date = timezone.localtime(event.occurred_at).date()
    if date_from is not None and occurred_date < date_from:
        return False
    return not (date_to is not None and occurred_date > date_to)


def collect_edit_history_events(
    *,
    event_type: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[EditHistoryEvent]:
    normalized_type = (event_type or "").strip().upper()
    if normalized_type and normalized_type not in VALID_EVENT_TYPES:
        return []

    collectors = {
        "TRANSACTION_CORRECTED": _collect_transaction_corrections,
        "TRANSACTION_VOIDED": _collect_transaction_voids,
        "CUSTOMER_EDITED": _collect_customer_edits,
        "CUSTOMER_ARCHIVED": _collect_customer_archives,
    }

    if normalized_type:
        events = collectors[normalized_type]()
    else:
        events = []
        for collector in collectors.values():
            events.extend(collector())

    parsed_from = _parse_date(date_from)
    parsed_to = _parse_date(date_to)

    filtered = [
        event
        for event in events
        if _matches_search(event, search or "")
        and _matches_date_range(event, date_from=parsed_from, date_to=parsed_to)
    ]
    filtered.sort(key=lambda event: event.occurred_at, reverse=True)
    return filtered
