from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction as db_transaction
from django.utils import timezone

from customers.models import Customer, CustomerVersion
from customers.validators import normalize_bangladesh_phone


@dataclass(frozen=True)
class CustomerVersionResult:
    customer: Customer
    version: CustomerVersion
    previous_version: CustomerVersion | None


def _customer_phone_display(customer: Customer) -> str:
    return customer.phone or customer.phone_bn or customer.phone_en or ""


def snapshot_customer_fields(customer: Customer) -> dict[str, str]:
    return {
        "customer_name_bn": customer.full_name_bn,
        "customer_name_en": customer.full_name_en,
        "customer_address_bn": customer.address_bn,
        "customer_address_en": customer.address_en,
        "customer_phone": _customer_phone_display(customer),
    }


def _denormalize_customer_from_version(customer: Customer, version: CustomerVersion) -> None:
    customer.full_name_bn = version.full_name_bn
    customer.full_name_en = version.full_name_en
    customer.address_bn = version.address_bn
    customer.address_en = version.address_en
    customer.phone_bn = version.phone_bn
    customer.phone_en = version.phone_en
    customer.phone = normalize_bangladesh_phone(version.phone_en)
    customer.father_name_bn = version.father_name_bn
    customer.father_name_en = version.father_name_en
    customer.memo_page_number_bn = version.memo_page_number_bn
    customer.memo_page_number_en = version.memo_page_number_en
    customer.mediator_name_bn = version.mediator_name_bn
    customer.mediator_name_en = version.mediator_name_en
    if version.profile_picture:
        customer.profile_picture = version.profile_picture


def _validate_phone_unique(phone: str, *, exclude_customer_id: int | None = None) -> None:
    queryset = Customer.objects.filter(phone=phone, is_archived=False)
    if exclude_customer_id is not None:
        queryset = queryset.exclude(pk=exclude_customer_id)
    if queryset.exists():
        raise ValueError("A customer with this phone number already exists.")


def _version_fields_from_customer(customer: Customer) -> dict:
    return {
        "full_name_bn": customer.full_name_bn,
        "full_name_en": customer.full_name_en,
        "address_bn": customer.address_bn,
        "address_en": customer.address_en,
        "phone_bn": customer.phone_bn,
        "phone_en": customer.phone_en,
        "father_name_bn": customer.father_name_bn,
        "father_name_en": customer.father_name_en,
        "memo_page_number_bn": customer.memo_page_number_bn,
        "memo_page_number_en": customer.memo_page_number_en,
        "mediator_name_bn": customer.mediator_name_bn,
        "mediator_name_en": customer.mediator_name_en,
        "profile_picture": customer.profile_picture,
    }


@db_transaction.atomic
def create_customer_version_record(
    *,
    customer: Customer,
    version_number: int,
    previous_version: CustomerVersion | None,
    is_current: bool,
    change_reason: str,
    created_by=None,
    **profile_fields,
) -> CustomerVersion:
    return CustomerVersion.objects.create(
        customer=customer,
        version_number=version_number,
        previous_version=previous_version,
        is_current=is_current,
        change_reason=change_reason,
        created_by=created_by,
        **profile_fields,
    )


@db_transaction.atomic
def create_customer_with_version(
    *,
    created_by=None,
    **profile_fields,
) -> Customer:
    profile_fields.pop("phone", None)
    phone = normalize_bangladesh_phone(profile_fields["phone_en"])
    _validate_phone_unique(phone)

    customer = Customer.objects.create(
        phone=phone,
        is_archived=False,
        **profile_fields,
    )
    create_customer_version_record(
        customer=customer,
        version_number=1,
        previous_version=None,
        is_current=True,
        change_reason="",
        created_by=created_by,
        **_version_fields_from_customer(customer),
    )
    return customer


@db_transaction.atomic
def create_customer_version(
    *,
    customer_id: int,
    change_reason: str,
    created_by=None,
    **profile_fields,
) -> CustomerVersionResult:
    customer = Customer.objects.select_for_update().get(pk=customer_id)
    if customer.is_archived:
        raise ValueError("Archived customers cannot be edited.")

    profile_fields.pop("phone", None)
    phone = normalize_bangladesh_phone(profile_fields["phone_en"])
    _validate_phone_unique(phone, exclude_customer_id=customer.pk)

    current_version = (
        CustomerVersion.objects.select_for_update()
        .filter(customer=customer, is_current=True)
        .first()
    )

    if current_version is not None:
        current_version.is_current = False
        current_version.save(update_fields=["is_current"])
        next_version_number = current_version.version_number + 1
        previous_version = current_version
        if "profile_picture" not in profile_fields or not profile_fields.get("profile_picture"):
            profile_fields["profile_picture"] = current_version.profile_picture
    else:
        next_version_number = 1
        previous_version = None
        if "profile_picture" not in profile_fields or not profile_fields.get("profile_picture"):
            profile_fields["profile_picture"] = customer.profile_picture

    new_version = create_customer_version_record(
        customer=customer,
        version_number=next_version_number,
        previous_version=previous_version,
        is_current=True,
        change_reason=change_reason.strip(),
        created_by=created_by,
        **profile_fields,
    )
    _denormalize_customer_from_version(customer, new_version)
    customer.save()
    return CustomerVersionResult(
        customer=customer,
        version=new_version,
        previous_version=previous_version,
    )


@db_transaction.atomic
def archive_customer(
    *,
    customer_id: int,
    archive_reason: str,
    archived_by=None,
) -> Customer:
    customer = Customer.objects.select_for_update().get(pk=customer_id)
    if customer.is_archived:
        raise ValueError("Customer is already archived.")

    customer.is_archived = True
    customer.archived_at = timezone.now()
    customer.archived_by = archived_by
    customer.archive_reason = archive_reason.strip()
    customer.save(
        update_fields=[
            "is_archived",
            "archived_at",
            "archived_by",
            "archive_reason",
            "updated_at",
        ]
    )
    return customer


def get_customer_version_history(customer_id: int) -> list[CustomerVersion]:
    return list(
        CustomerVersion.objects.filter(customer_id=customer_id)
        .select_related("created_by", "previous_version")
        .order_by("version_number")
    )
