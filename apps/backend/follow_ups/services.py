from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.utils import timezone

from customers.models import Customer
from follow_ups.exceptions import (
    ArchivedCustomerFollowUp,
    FollowUpNotActionable,
    InvalidFollowUpDate,
)
from follow_ups.models import CustomerFollowUp, FollowUpStatus

User = get_user_model()


@dataclass(frozen=True)
class CustomerFollowUpsResult:
    active: CustomerFollowUp | None
    history: list[CustomerFollowUp]


@dataclass(frozen=True)
class DashboardFollowUpItem:
    follow_up: CustomerFollowUp
    is_overdue: bool
    is_today: bool
    current_balance: object  # Decimal


def follow_up_timing_flags(
    follow_up_date: date,
    *,
    as_of_date: date | None = None,
) -> tuple[bool, bool]:
    today = as_of_date or timezone.localdate()
    is_overdue = follow_up_date < today
    is_today = follow_up_date == today
    return is_overdue, is_today


def _ensure_customer_can_follow_up(customer: Customer) -> None:
    if customer.is_archived:
        raise ArchivedCustomerFollowUp()


def _validate_follow_up_date(*, follow_up_date: date, actor) -> None:
    today = timezone.localdate()
    if follow_up_date >= today:
        return
    if actor is not None and getattr(actor, "is_superuser", False):
        return
    raise InvalidFollowUpDate()


def _resolve_assigned_to(*, actor, assigned_to=None):
    if assigned_to is not None:
        return assigned_to
    return actor


def get_pending_follow_up(customer_id: int) -> CustomerFollowUp | None:
    return (
        CustomerFollowUp.objects.filter(
            customer_id=customer_id,
            status=FollowUpStatus.PENDING,
        )
        .select_related("customer", "assigned_to", "created_by", "completed_by", "rescheduled_from")
        .first()
    )


def get_customer_follow_ups(customer_id: int) -> CustomerFollowUpsResult:
    queryset = (
        CustomerFollowUp.objects.filter(customer_id=customer_id)
        .select_related("assigned_to", "created_by", "completed_by", "rescheduled_from")
        .order_by("-created_at")
    )
    active = get_pending_follow_up(customer_id)
    history = [item for item in queryset if item.status != FollowUpStatus.PENDING]
    return CustomerFollowUpsResult(active=active, history=history)


@db_transaction.atomic
def create_follow_up(
    *,
    customer: Customer,
    follow_up_date: date,
    note: str = "",
    actor,
    assigned_to=None,
) -> CustomerFollowUp:
    _ensure_customer_can_follow_up(customer)
    _validate_follow_up_date(follow_up_date=follow_up_date, actor=actor)

    pending = get_pending_follow_up(customer.pk)
    if pending is not None:
        return reschedule_follow_up(
            pending,
            follow_up_date=follow_up_date,
            note=note,
            actor=actor,
            assigned_to=assigned_to,
        )

    return CustomerFollowUp.objects.create(
        customer=customer,
        follow_up_date=follow_up_date,
        note=(note or "").strip(),
        status=FollowUpStatus.PENDING,
        created_by=actor,
        assigned_to=_resolve_assigned_to(actor=actor, assigned_to=assigned_to),
    )


@db_transaction.atomic
def reschedule_follow_up(
    follow_up: CustomerFollowUp,
    *,
    follow_up_date: date,
    note: str | None = None,
    actor,
    assigned_to=None,
) -> CustomerFollowUp:
    follow_up = (
        CustomerFollowUp.objects.select_for_update().select_related("customer").get(pk=follow_up.pk)
    )
    _ensure_customer_can_follow_up(follow_up.customer)

    if follow_up.status != FollowUpStatus.PENDING:
        raise FollowUpNotActionable()

    _validate_follow_up_date(follow_up_date=follow_up_date, actor=actor)

    resolved_note = (note if note is not None else follow_up.note).strip()
    resolved_assigned_to = (
        assigned_to if assigned_to is not None else follow_up.assigned_to or follow_up.created_by
    )

    follow_up.status = FollowUpStatus.RESCHEDULED
    follow_up.save(update_fields=["status", "updated_at"])

    return CustomerFollowUp.objects.create(
        customer=follow_up.customer,
        follow_up_date=follow_up_date,
        note=resolved_note,
        status=FollowUpStatus.PENDING,
        created_by=actor,
        assigned_to=_resolve_assigned_to(actor=actor, assigned_to=resolved_assigned_to),
        rescheduled_from=follow_up,
    )


@db_transaction.atomic
def update_follow_up(
    follow_up: CustomerFollowUp,
    *,
    follow_up_date: date | None = None,
    note: str | None = None,
    actor,
    assigned_to=None,
) -> CustomerFollowUp:
    follow_up = (
        CustomerFollowUp.objects.select_for_update().select_related("customer").get(pk=follow_up.pk)
    )
    _ensure_customer_can_follow_up(follow_up.customer)

    if follow_up.status != FollowUpStatus.PENDING:
        raise FollowUpNotActionable()

    if follow_up_date is not None and follow_up_date != follow_up.follow_up_date:
        return reschedule_follow_up(
            follow_up,
            follow_up_date=follow_up_date,
            note=note if note is not None else follow_up.note,
            actor=actor,
            assigned_to=assigned_to,
        )

    update_fields: list[str] = ["updated_at"]
    if note is not None:
        follow_up.note = note.strip()
        update_fields.append("note")
    if assigned_to is not None:
        follow_up.assigned_to = assigned_to
        update_fields.append("assigned_to")

    if len(update_fields) > 1:
        follow_up.save(update_fields=update_fields)

    return follow_up


@db_transaction.atomic
def complete_follow_up(
    follow_up: CustomerFollowUp,
    *,
    actor,
    completion_note: str = "",
) -> CustomerFollowUp:
    follow_up = CustomerFollowUp.objects.select_for_update().get(pk=follow_up.pk)

    if follow_up.status in {
        FollowUpStatus.COMPLETED,
        FollowUpStatus.CANCELLED,
        FollowUpStatus.RESCHEDULED,
    }:
        raise FollowUpNotActionable()

    follow_up.status = FollowUpStatus.COMPLETED
    follow_up.completed_at = timezone.now()
    follow_up.completed_by = actor
    follow_up.completion_note = (completion_note or "").strip()
    follow_up.save(
        update_fields=[
            "status",
            "completed_at",
            "completed_by",
            "completion_note",
            "updated_at",
        ]
    )
    return follow_up


@db_transaction.atomic
def cancel_follow_up(
    follow_up: CustomerFollowUp,
    *,
    actor,
) -> CustomerFollowUp:
    del actor
    follow_up = CustomerFollowUp.objects.select_for_update().get(pk=follow_up.pk)

    if follow_up.status == FollowUpStatus.COMPLETED:
        raise FollowUpNotActionable()

    if follow_up.status != FollowUpStatus.PENDING:
        raise FollowUpNotActionable()

    follow_up.status = FollowUpStatus.CANCELLED
    follow_up.save(update_fields=["status", "updated_at"])
    return follow_up


def get_dashboard_due_follow_ups(*, as_of_date: date | None = None) -> list[DashboardFollowUpItem]:
    from transactions.services import calculate_customer_balances_bulk

    today = as_of_date or timezone.localdate()
    follow_ups = list(
        CustomerFollowUp.objects.filter(
            status=FollowUpStatus.PENDING,
            follow_up_date__lte=today,
            customer__is_archived=False,
        )
        .select_related(
            "customer",
            "assigned_to",
            "created_by",
        )
        .order_by("follow_up_date", "id")
    )

    customer_ids = [item.customer_id for item in follow_ups]
    balances = calculate_customer_balances_bulk(customer_ids)

    result: list[DashboardFollowUpItem] = []
    for item in follow_ups:
        is_overdue, is_today = follow_up_timing_flags(item.follow_up_date, as_of_date=today)
        result.append(
            DashboardFollowUpItem(
                follow_up=item,
                is_overdue=is_overdue,
                is_today=is_today,
                current_balance=balances.get(item.customer_id, 0),
            )
        )
    return result
