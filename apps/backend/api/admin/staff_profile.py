from __future__ import annotations

from django.contrib.auth import get_user_model

from api.models import AdminStaffProfile

User = get_user_model()


def get_staff_profile(user) -> AdminStaffProfile | None:
    if user is None or not getattr(user, "pk", None):
        return None
    try:
        return user.staff_profile
    except AdminStaffProfile.DoesNotExist:
        return None


def must_change_password_for_user(user) -> bool:
    profile = get_staff_profile(user)
    if profile is None:
        return False
    return profile.must_change_password


def ensure_staff_profile(
    user,
    *,
    phone: str = "",
    must_change_password: bool = False,
    created_by=None,
    updated_by=None,
) -> AdminStaffProfile:
    profile, created = AdminStaffProfile.objects.get_or_create(
        user=user,
        defaults={
            "phone": phone,
            "must_change_password": must_change_password,
            "created_by": created_by,
            "updated_by": updated_by,
        },
    )
    if not created:
        updates: list[str] = []
        if phone and profile.phone != phone:
            profile.phone = phone
            updates.append("phone")
        if updated_by is not None and profile.updated_by_id != getattr(updated_by, "pk", None):
            profile.updated_by = updated_by
            updates.append("updated_by")
        if updates:
            profile.save(update_fields=updates)
    return profile
