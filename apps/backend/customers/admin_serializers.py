from rest_framework import serializers

from customers.models import Customer, CustomerVersion
from customers.services import (
    archive_customer,
    create_customer_version,
    create_customer_with_version,
)
from customers.validators import (
    normalize_bangladesh_phone,
    normalize_phone_en,
    validate_digits_only,
    validate_memo_page_number_bn,
    validate_profile_picture,
    validate_required_text,
)
from transactions.exceptions import CustomerArchiveNotAllowed, CustomerVersionNotAllowed


class CustomerProfileFieldsMixin(metaclass=serializers.SerializerMetaclass):
    fullNameBn = serializers.CharField(source="full_name_bn")
    fullNameEn = serializers.CharField(source="full_name_en")
    addressBn = serializers.CharField(source="address_bn")
    addressEn = serializers.CharField(source="address_en")
    phoneBn = serializers.CharField(source="phone_bn")
    phoneEn = serializers.CharField(source="phone_en")
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

    def _normalize_profile_attrs(self, attrs: dict) -> dict:
        mediator_bn = (attrs.get("mediator_name_bn") or "").strip()
        mediator_en = (attrs.get("mediator_name_en") or "").strip()
        attrs["mediator_name_bn"] = mediator_bn
        attrs["mediator_name_en"] = mediator_en
        return attrs


class CustomerAdminSerializer(CustomerProfileFieldsMixin, serializers.ModelSerializer):
    phone = serializers.CharField(read_only=True)
    profilePictureUrl = serializers.SerializerMethodField()
    cachedBalance = serializers.DecimalField(
        source="cached_balance",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    isArchived = serializers.BooleanField(source="is_archived", read_only=True)
    archivedAt = serializers.DateTimeField(source="archived_at", read_only=True)
    archiveReason = serializers.CharField(source="archive_reason", read_only=True)
    archivedByName = serializers.SerializerMethodField()
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
            "isArchived",
            "archivedAt",
            "archiveReason",
            "archivedByName",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "phone",
            "profilePictureUrl",
            "cachedBalance",
            "isArchived",
            "archivedAt",
            "archiveReason",
            "archivedByName",
            "createdAt",
            "updatedAt",
        ]

    def get_profilePictureUrl(self, obj: Customer) -> str | None:
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        url = obj.profile_picture.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_archivedByName(self, obj: Customer) -> str | None:
        if obj.archived_by is None:
            return None
        return obj.archived_by.get_username()

    def validate(self, attrs):
        return self._normalize_profile_attrs(attrs)

    def create(self, validated_data):
        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None
        profile_picture = validated_data.pop("profile_picture", None)
        if profile_picture is not None:
            validated_data["profile_picture"] = profile_picture
        try:
            return create_customer_with_version(created_by=created_by, **validated_data)
        except ValueError as exc:
            raise serializers.ValidationError({"phoneEn": [str(exc)]}) from exc


class CustomerVersionWriteSerializer(CustomerProfileFieldsMixin, serializers.Serializer):
    changeReason = serializers.CharField(
        source="change_reason",
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_changeReason(self, value: str) -> str:
        return (value or "").strip()

    def validate(self, attrs):
        return self._normalize_profile_attrs(attrs)

    def save(self):
        customer: Customer = self.context["customer"]
        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None
        validated = self.validated_data
        change_reason = validated.pop("change_reason", "")
        profile_picture = validated.pop("profile_picture", serializers.empty)
        if profile_picture is not serializers.empty:
            validated["profile_picture"] = profile_picture
        try:
            return create_customer_version(
                customer_id=customer.pk,
                change_reason=change_reason,
                created_by=created_by,
                **validated,
            )
        except ValueError as exc:
            raise CustomerVersionNotAllowed(str(exc)) from exc


class CustomerVersionReadSerializer(serializers.ModelSerializer):
    fullNameBn = serializers.CharField(source="full_name_bn")
    fullNameEn = serializers.CharField(source="full_name_en")
    addressBn = serializers.CharField(source="address_bn")
    addressEn = serializers.CharField(source="address_en")
    phoneBn = serializers.CharField(source="phone_bn")
    phoneEn = serializers.CharField(source="phone_en")
    fatherNameBn = serializers.CharField(source="father_name_bn")
    fatherNameEn = serializers.CharField(source="father_name_en")
    memoPageNumberBn = serializers.CharField(source="memo_page_number_bn")
    memoPageNumberEn = serializers.CharField(source="memo_page_number_en")
    mediatorNameBn = serializers.CharField(source="mediator_name_bn")
    mediatorNameEn = serializers.CharField(source="mediator_name_en")
    profilePictureUrl = serializers.SerializerMethodField()
    changeReason = serializers.CharField(source="change_reason")
    isCurrent = serializers.BooleanField(source="is_current")
    versionNumber = serializers.IntegerField(source="version_number")
    previousVersionId = serializers.IntegerField(source="previous_version_id", allow_null=True)
    createdByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = CustomerVersion
        fields = [
            "id",
            "versionNumber",
            "isCurrent",
            "previousVersionId",
            "fullNameBn",
            "fullNameEn",
            "addressBn",
            "addressEn",
            "phoneBn",
            "phoneEn",
            "fatherNameBn",
            "fatherNameEn",
            "memoPageNumberBn",
            "memoPageNumberEn",
            "mediatorNameBn",
            "mediatorNameEn",
            "profilePictureUrl",
            "changeReason",
            "createdByName",
            "createdAt",
        ]

    def get_profilePictureUrl(self, obj: CustomerVersion) -> str | None:
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        url = obj.profile_picture.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_createdByName(self, obj: CustomerVersion) -> str | None:
        if obj.created_by is None:
            return None
        return obj.created_by.get_username()


class CustomerHistorySerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    versions = CustomerVersionReadSerializer(many=True)


class CustomerArchiveSerializer(serializers.Serializer):
    archiveReason = serializers.CharField()

    def validate_archiveReason(self, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise serializers.ValidationError("Archive reason is required.")
        return normalized

    def save(self):
        customer: Customer = self.context["customer"]
        request = self.context.get("request")
        archived_by = request.user if request and request.user.is_authenticated else None
        try:
            return archive_customer(
                customer_id=customer.pk,
                archive_reason=self.validated_data["archiveReason"],
                archived_by=archived_by,
            )
        except ValueError as exc:
            raise CustomerArchiveNotAllowed(str(exc)) from exc
