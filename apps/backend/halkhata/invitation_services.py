from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q, QuerySet

from customers.models import Customer
from customers.search_ranking import apply_ranked_customer_search
from halkhata.exceptions import (
    HalkhataClosed,
    HalkhataInvitationInvalidCustomers,
    HalkhataInvitationNoCustomers,
)
from halkhata.models import (
    Halkhata,
    HalkhataInvitationGeneration,
    HalkhataInvitationRecipientSnapshot,
    HalkhataInvitationSelectionMode,
    HalkhataStatus,
)


@dataclass(frozen=True)
class InvitationPageContext:
    total_active_customers: int
    total_due_customers: int
    can_generate: bool
    generation_count: int
    latest_generation_id: int | None


def get_invitation_page_context(halkhata: Halkhata) -> InvitationPageContext:
    active_customers = get_invitation_customer_queryset()
    total_active = active_customers.count()
    total_due = active_customers.filter(cached_balance__gt=Decimal("0")).count()
    generation_count = halkhata.invitation_generations.count()
    latest = (
        halkhata.invitation_generations.order_by("-generated_at", "-id")
        .values_list("id", flat=True)
        .first()
    )
    return InvitationPageContext(
        total_active_customers=total_active,
        total_due_customers=total_due,
        can_generate=halkhata.status == HalkhataStatus.ACTIVE,
        generation_count=generation_count,
        latest_generation_id=latest,
    )


def get_invitation_customer_queryset() -> QuerySet[Customer]:
    return Customer.objects.filter(is_archived=False)


def apply_invitation_customer_filters(
    queryset: QuerySet[Customer],
    *,
    search: str | None = None,
    address: str | None = None,
    mediator: str | None = None,
    has_due: bool | None = None,
) -> QuerySet[Customer]:
    if search:
        queryset = apply_ranked_customer_search(queryset, search)

    address_value = (address or "").strip()
    if address_value:
        queryset = queryset.filter(
            Q(address_bn__icontains=address_value) | Q(address_en__icontains=address_value)
        )

    mediator_value = (mediator or "").strip()
    if mediator_value:
        queryset = queryset.filter(
            Q(mediator_name_bn__icontains=mediator_value)
            | Q(mediator_name_en__icontains=mediator_value)
        )

    if has_due is True:
        queryset = queryset.filter(cached_balance__gt=Decimal("0"))
    elif has_due is False:
        queryset = queryset.filter(cached_balance__lte=Decimal("0"))

    return queryset


def resolve_customer_ids(
    selection_mode: str,
    customer_ids: list[int] | None,
) -> list[int]:
    base_qs = get_invitation_customer_queryset()

    if selection_mode == HalkhataInvitationSelectionMode.MANUAL:
        ids = list(dict.fromkeys(customer_ids or []))
        if not ids:
            raise HalkhataInvitationNoCustomers()
        found_ids = set(base_qs.filter(id__in=ids).values_list("id", flat=True))
        if len(found_ids) != len(ids):
            raise HalkhataInvitationInvalidCustomers()
        return ids

    if selection_mode == HalkhataInvitationSelectionMode.ALL_ACTIVE:
        ids = list(
            base_qs.order_by("full_name_bn", "full_name_en", "id").values_list("id", flat=True)
        )
        if not ids:
            raise HalkhataInvitationNoCustomers()
        return ids

    if selection_mode == HalkhataInvitationSelectionMode.DUE_ONLY:
        ids = list(
            base_qs.filter(cached_balance__gt=Decimal("0"))
            .order_by("full_name_bn", "full_name_en", "id")
            .values_list("id", flat=True)
        )
        if not ids:
            raise HalkhataInvitationNoCustomers()
        return ids

    raise HalkhataInvitationInvalidCustomers()


def _display_name(customer: Customer) -> str:
    return (customer.full_name_bn or customer.full_name_en or "").strip()


def _display_phone(customer: Customer) -> str:
    return (customer.phone_bn or customer.phone_en or customer.phone or "").strip()


def _display_address(customer: Customer) -> str:
    return (customer.address_bn or customer.address_en or "").strip()


def _display_father_name(customer: Customer) -> str:
    return (customer.father_name_bn or customer.father_name_en or "").strip()


def _display_memo_page(customer: Customer) -> str:
    return (customer.memo_page_number_bn or customer.memo_page_number_en or "").strip()


def _build_snapshot(
    generation: HalkhataInvitationGeneration,
    customer: Customer,
    sort_order: int,
) -> HalkhataInvitationRecipientSnapshot:
    return HalkhataInvitationRecipientSnapshot(
        generation=generation,
        customer=customer,
        customer_name_snapshot=_display_name(customer),
        phone_snapshot=_display_phone(customer),
        address_snapshot=_display_address(customer),
        father_name_snapshot=_display_father_name(customer),
        due_amount_snapshot=customer.cached_balance,
        memo_page_number_snapshot=_display_memo_page(customer),
        sort_order=sort_order,
    )


@transaction.atomic
def create_invitation_generation(
    halkhata: Halkhata,
    user,
    selection_mode: str,
    customer_ids: list[int] | None,
    notes: str = "",
) -> HalkhataInvitationGeneration:
    if halkhata.status != HalkhataStatus.ACTIVE:
        raise HalkhataClosed()

    resolved_ids = resolve_customer_ids(selection_mode, customer_ids)
    customers = list(
        get_invitation_customer_queryset()
        .filter(id__in=resolved_ids)
        .order_by("full_name_bn", "full_name_en", "id")
    )
    if len(customers) != len(resolved_ids):
        raise HalkhataInvitationInvalidCustomers()

    generation = HalkhataInvitationGeneration.objects.create(
        halkhata=halkhata,
        generated_by=user if getattr(user, "is_authenticated", False) else None,
        customer_selection_mode=selection_mode,
        customer_count=len(resolved_ids),
        selected_customer_ids=resolved_ids,
        notes=(notes or "").strip(),
    )

    snapshots = [
        _build_snapshot(generation, customer, index) for index, customer in enumerate(customers)
    ]
    HalkhataInvitationRecipientSnapshot.objects.bulk_create(snapshots)

    return generation


def get_generation_for_print(halkhata_id: int, generation_id: int) -> HalkhataInvitationGeneration:
    return (
        HalkhataInvitationGeneration.objects.select_related("halkhata", "generated_by")
        .prefetch_related("recipients")
        .get(pk=generation_id, halkhata_id=halkhata_id)
    )


def get_generation_list_queryset(halkhata_id: int) -> QuerySet[HalkhataInvitationGeneration]:
    return (
        HalkhataInvitationGeneration.objects.filter(halkhata_id=halkhata_id)
        .select_related("generated_by")
        .annotate(recipient_count=Count("recipients"))
        .order_by("-generated_at", "-id")
    )
