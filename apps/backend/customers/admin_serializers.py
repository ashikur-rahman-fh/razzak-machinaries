from rest_framework import serializers

from customers.models import Customer
from customers.validators import (
    normalize_bangladesh_phone,
    normalize_phone_en,
    validate_digits_only,
    validate_memo_page_number_bn,
    validate_profile_picture,
    validate_required_text,
)


class CustomerAdminSerializer(serializers.ModelSerializer):
    fullNameBn = serializers.CharField(source="full_name_bn")
    fullNameEn = serializers.CharField(source="full_name_en")
    addressBn = serializers.CharField(source="address_bn")
    addressEn = serializers.CharField(source="address_en")
    phoneBn = serializers.CharField(source="phone_bn")
    phoneEn = serializers.CharField(source="phone_en")
    phone = serializers.CharField(read_only=True)
    fatherNameBn = serializers.CharField(source="father_name_bn")
    fatherNameEn = serializers.CharField(source="father_name_en")
    memoPageNumberBn = serializers.CharField(source="memo_page_number_bn")
    memoPageNumberEn = serializers.CharField(source="memo_page_number_en")
    mediatorNameBn = serializers.CharField(
        source="mediator_name_bn",
        required=False,
        allow_blank=True,
        default="",
    )
    mediatorNameEn = serializers.CharField(
        source="mediator_name_en",
        required=False,
        allow_blank=True,
        default="",
    )
    profilePicture = serializers.ImageField(
        source="profile_picture",
        required=False,
        allow_null=True,
    )
    profilePictureUrl = serializers.SerializerMethodField()
    cachedBalance = serializers.DecimalField(
        source="cached_balance",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "fullNameBn",
            "fullNameEn",
            "addressBn",
            "addressEn",
            "phoneBn",
            "phoneEn",
            "phone",
            "fatherNameBn",
            "fatherNameEn",
            "memoPageNumberBn",
            "memoPageNumberEn",
            "mediatorNameBn",
            "mediatorNameEn",
            "profilePicture",
            "profilePictureUrl",
            "cachedBalance",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "phone", "profilePictureUrl", "createdAt", "updatedAt"]

    def get_profilePictureUrl(self, obj: Customer) -> str | None:
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        url = obj.profile_picture.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def validate_fullNameBn(self, value: str) -> str:
        return validate_required_text(value, field_label="Full name (Bangla)")

    def validate_fullNameEn(self, value: str) -> str:
        return validate_required_text(value, field_label="Full name (English)")

    def validate_addressBn(self, value: str) -> str:
        return validate_required_text(value, field_label="Address (Bangla)")

    def validate_addressEn(self, value: str) -> str:
        return validate_required_text(value, field_label="Address (English)")

    def validate_fatherNameBn(self, value: str) -> str:
        return validate_required_text(value, field_label="Father's name (Bangla)")

    def validate_fatherNameEn(self, value: str) -> str:
        return validate_required_text(value, field_label="Father's name (English)")

    def validate_phoneBn(self, value: str) -> str:
        return validate_required_text(value, field_label="Phone number (Bangla)")

    def validate_phoneEn(self, value: str) -> str:
        normalized = normalize_phone_en(value)
        if not normalized:
            raise serializers.ValidationError("Phone number (Latin) is required.")
        normalize_bangladesh_phone(normalized)
        return normalized

    def validate_memoPageNumberBn(self, value: str) -> str:
        return validate_memo_page_number_bn(value)

    def validate_memoPageNumberEn(self, value: str) -> str:
        return validate_digits_only(value, field_label="Memo page number (Latin)")

    def validate_profilePicture(self, upload):
        if upload is None:
            return upload
        validate_profile_picture(upload)
        return upload

    def validate(self, attrs):
        mediator_bn = (attrs.get("mediator_name_bn") or "").strip()
        mediator_en = (attrs.get("mediator_name_en") or "").strip()
        attrs["mediator_name_bn"] = mediator_bn
        attrs["mediator_name_en"] = mediator_en

        phone_en = attrs.get("phone_en")
        if phone_en is not None:
            attrs["phone"] = normalize_bangladesh_phone(phone_en)

        return attrs
