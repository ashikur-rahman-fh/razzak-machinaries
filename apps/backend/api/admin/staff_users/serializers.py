from __future__ import annotations

import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from api.admin.exceptions import WeakPassword
from api.admin.password_utils import generate_readable_temporary_password
from api.admin.serializers import display_name_for_user
from api.admin.staff_profile import ensure_staff_profile
from api.models import AdminStaffProfile

User = get_user_model()

_PHONE_PATTERN = re.compile(r"^[\d+\-()\s]{0,32}$")


def _actor_name(user) -> str | None:
    if user is None:
        return None
    name = display_name_for_user(user)
    return name or user.get_username()


def serialize_staff_user(user, *, include_profile: bool = True) -> dict:
    profile = None
    if include_profile and user is not None and getattr(user, "pk", None):
        if hasattr(user, "_prefetched_objects_cache") and "staff_profile" in getattr(
            user, "_prefetched_objects_cache", {}
        ):
            profile = user.staff_profile
        elif hasattr(user, "staff_profile"):
            try:
                profile = user.staff_profile
            except AdminStaffProfile.DoesNotExist:
                profile = None
        if profile is None:
            profile = AdminStaffProfile.objects.filter(user_id=user.pk).first()

    payload = {
        "id": user.pk,
        "name": display_name_for_user(user),
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
        "username": user.username,
        "email": user.email or "",
        "phone": profile.phone if profile else "",
        "isActive": user.is_active,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
        "mustChangePassword": profile.must_change_password if profile else False,
        "createdAt": profile.created_at.isoformat() if profile else None,
        "updatedAt": profile.updated_at.isoformat() if profile else None,
        "createdByName": _actor_name(profile.created_by)
        if profile and profile.created_by
        else None,
        "updatedByName": _actor_name(profile.updated_by)
        if profile and profile.updated_by
        else None,
    }
    return payload


class StaffUserCreateSerializer(serializers.Serializer):
    firstName = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    lastName = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    username = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    email = serializers.EmailField(required=False, allow_blank=True, trim_whitespace=True)
    phone = serializers.CharField(
        required=False, allow_blank=True, trim_whitespace=True, max_length=32
    )
    isActive = serializers.BooleanField(required=False, default=True)
    temporaryPassword = serializers.CharField(
        required=False,
        allow_blank=False,
        write_only=True,
        trim_whitespace=False,
    )

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return username

    def validate_email(self, value: str) -> str:
        if not value or not value.strip():
            return ""
        email = value.strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_phone(self, value: str) -> str:
        phone = (value or "").strip()
        if phone and not _PHONE_PATTERN.match(phone):
            raise serializers.ValidationError("Enter a valid phone number.")
        return phone

    def validate_temporaryPassword(self, value: str) -> str:
        if not value:
            return value
        return value

    def validate(self, attrs):
        password = attrs.get("temporaryPassword")
        if password:
            user = User(
                username=attrs["username"],
                email=attrs.get("email") or "",
                first_name=attrs["firstName"],
                last_name=attrs["lastName"],
            )
            try:
                validate_password(password, user=user)
            except DjangoValidationError:
                raise WeakPassword() from None
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        actor = self.context["request"].user
        password = validated_data.pop("temporaryPassword", None)
        is_active = validated_data.pop("isActive", True)
        phone = validated_data.pop("phone", "")
        email = validated_data.pop("email", "")

        if not password:
            user = User(
                username=validated_data["username"],
                email=email,
                first_name=validated_data["firstName"],
                last_name=validated_data["lastName"],
            )
            password = generate_readable_temporary_password(user=user)

        user = User.objects.create_user(
            username=validated_data["username"],
            email=email,
            password=password,
            first_name=validated_data["firstName"],
            last_name=validated_data["lastName"],
            is_staff=True,
            is_superuser=False,
            is_active=is_active,
        )
        ensure_staff_profile(
            user,
            phone=phone,
            must_change_password=False,
            created_by=actor,
            updated_by=actor,
        )
        self.context["temporary_password"] = password
        return user


class StaffUserUpdateSerializer(serializers.Serializer):
    firstName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    lastName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    email = serializers.EmailField(required=False, allow_blank=True, trim_whitespace=True)
    phone = serializers.CharField(
        required=False, allow_blank=True, trim_whitespace=True, max_length=32
    )
    isActive = serializers.BooleanField(required=False)

    def validate_email(self, value: str) -> str:
        if not value or not value.strip():
            return ""
        email = value.strip()
        user = self.context["instance"]
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_phone(self, value: str) -> str:
        phone = (value or "").strip()
        if phone and not _PHONE_PATTERN.match(phone):
            raise serializers.ValidationError("Enter a valid phone number.")
        return phone

    def validate(self, attrs):
        forbidden = {"username", "isStaff", "isSuperuser", "temporaryPassword", "password"}
        extra = forbidden.intersection(self.initial_data.keys())
        if extra:
            raise serializers.ValidationError(
                {key: "This field cannot be updated." for key in sorted(extra)}
            )
        if not attrs:
            raise serializers.ValidationError("At least one field must be provided.")
        return attrs

    def validate_isActive(self, value: bool) -> bool:
        actor = self.context["request"].user
        instance = self.context["instance"]
        if value is False and instance.pk == actor.pk:
            raise serializers.ValidationError("You cannot deactivate your own account.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        actor = self.context["request"].user
        profile = ensure_staff_profile(instance, must_change_password=False, updated_by=actor)

        if "firstName" in validated_data:
            instance.first_name = validated_data["firstName"]
        if "lastName" in validated_data:
            instance.last_name = validated_data["lastName"]
        if "email" in validated_data:
            instance.email = validated_data["email"]
        if "isActive" in validated_data:
            instance.is_active = validated_data["isActive"]
        if "phone" in validated_data:
            profile.phone = validated_data["phone"]
            profile.updated_by = actor
            profile.save(update_fields=["phone", "updated_by", "updated_at"])

        instance.save()
        profile.updated_by = actor
        profile.save(update_fields=["updated_by", "updated_at"])
        return instance


class GenerateTemporaryPasswordSerializer(serializers.Serializer):
    pass


class TemporaryPasswordResponseSerializer(serializers.Serializer):
    temporaryPassword = serializers.CharField(read_only=True)
