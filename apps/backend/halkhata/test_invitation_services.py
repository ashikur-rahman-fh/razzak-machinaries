from decimal import Decimal

import pytest

from halkhata.exceptions import (
    HalkhataClosed,
    HalkhataInvitationInvalidCustomers,
    HalkhataInvitationNoCustomers,
)
from halkhata.invitation_services import (
    apply_invitation_customer_filters,
    create_invitation_generation,
    get_invitation_customer_queryset,
    get_invitation_page_context,
    resolve_customer_ids,
)
from halkhata.models import Halkhata, HalkhataInvitationSelectionMode, HalkhataStatus
from tests.factories import create_superuser
from tests.test_admin_customers import _create_customer

pytestmark = pytest.mark.django_db


@pytest.fixture
def superuser():
    return create_superuser()


def _create_halkhata(**overrides):
    data = {
        "title": "Summer Halkhata",
        "date": "2026-06-27",
        "status": HalkhataStatus.ACTIVE,
    }
    data.update(overrides)
    return Halkhata.objects.create(**data)


def test_get_invitation_page_context_counts_active_and_due():
    halkhata = _create_halkhata()
    due_customer = _create_customer(phone_en="01710000001")
    due_customer.cached_balance = Decimal("500.00")
    due_customer.save(update_fields=["cached_balance"])
    _create_customer(phone_en="01710000002")

    context = get_invitation_page_context(halkhata)
    assert context.total_active_customers == 2
    assert context.total_due_customers == 1
    assert context.can_generate is True
    assert context.generation_count == 0


def test_resolve_customer_ids_manual_requires_customers():
    with pytest.raises(HalkhataInvitationNoCustomers):
        resolve_customer_ids(HalkhataInvitationSelectionMode.MANUAL, [])


def test_resolve_customer_ids_manual_rejects_archived():
    customer = _create_customer()
    customer.is_archived = True
    customer.save(update_fields=["is_archived"])

    with pytest.raises(HalkhataInvitationInvalidCustomers):
        resolve_customer_ids(HalkhataInvitationSelectionMode.MANUAL, [customer.id])


def test_resolve_customer_ids_due_only():
    due_customer = _create_customer(phone_en="01710000003")
    due_customer.cached_balance = Decimal("100.00")
    due_customer.save(update_fields=["cached_balance"])
    _create_customer(phone_en="01710000004")

    ids = resolve_customer_ids(HalkhataInvitationSelectionMode.DUE_ONLY, None)
    assert ids == [due_customer.id]


def test_apply_invitation_customer_filters_address_and_mediator():
    _create_customer(
        phone_en="01710000005",
        address_bn="গ্রাম: চরপাড়া",
        mediator_name_bn="মধ্যস্থতাকারী রফিক",
    )
    _create_customer(phone_en="01710000006", address_bn="অন্য ঠিকানা")

    queryset = get_invitation_customer_queryset()
    filtered = apply_invitation_customer_filters(
        queryset,
        address="চরপাড়া",
        mediator="রফিক",
    )
    assert filtered.count() == 1


def test_create_invitation_generation_creates_snapshots(superuser):
    halkhata = _create_halkhata()
    customer = _create_customer(
        phone_en="01710000007",
        full_name_bn="করিম",
        father_name_bn="আব্দুল",
        memo_page_number_bn="৫",
    )
    customer.cached_balance = Decimal("250.00")
    customer.save(update_fields=["cached_balance"])

    generation = create_invitation_generation(
        halkhata=halkhata,
        user=superuser,
        selection_mode=HalkhataInvitationSelectionMode.MANUAL,
        customer_ids=[customer.id],
        notes="Batch 1",
    )

    assert generation.customer_count == 1
    snapshot = generation.recipients.get()
    assert snapshot.customer_name_snapshot == "করিম"
    assert snapshot.father_name_snapshot == "আব্দুল"
    assert snapshot.due_amount_snapshot == Decimal("250.00")
    assert snapshot.memo_page_number_snapshot == "৫"


def test_create_invitation_generation_rejects_closed_halkhata(superuser):
    halkhata = _create_halkhata(status=HalkhataStatus.CLOSED)
    customer = _create_customer(phone_en="01710000008")

    with pytest.raises(HalkhataClosed):
        create_invitation_generation(
            halkhata=halkhata,
            user=superuser,
            selection_mode=HalkhataInvitationSelectionMode.MANUAL,
            customer_ids=[customer.id],
        )
