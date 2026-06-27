from __future__ import annotations

from rest_framework import serializers

from api.admin.serializers import display_name_for_user
from customers.models import Customer
from halkhata.invitation_services import create_invitation_generation, get_invitation_page_context
from halkhata.models import (
    Halkhata,
    HalkhataInvitationGeneration,
    HalkhataInvitationRecipientSnapshot,
    HalkhataInvitationSelectionMode,
)


def _actor_name(user) -> str | None:
    if user is None:
        return None
    name = display_name_for_user(user)
    return name or user.get_username()


class InvitationCustomerSerializer(serializers.ModelSerializer):
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
    mediatorNameBn = serializers.CharField(source="mediator_name_bn")
    mediatorNameEn = serializers.CharField(source="mediator_name_en")
    cachedBalance = serializers.DecimalField(
        source="cached_balance",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

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
            "cachedBalance",
        ]


class HalkhataInvitationPageContextSerializer(serializers.Serializer):
    halkhataId = serializers.IntegerField(source="halkhata.id")
    halkhataTitle = serializers.CharField(source="halkhata.title")
    halkhataDate = serializers.DateField(source="halkhata.date")
    halkhataStatus = serializers.CharField(source="halkhata.status")
    totalActiveCustomers = serializers.IntegerField()
    totalDueCustomers = serializers.IntegerField()
    canGenerate = serializers.BooleanField()
    generationCount = serializers.IntegerField()
    latestGenerationId = serializers.IntegerField(allow_null=True)

    @staticmethod
    def build_payload(halkhata: Halkhata) -> dict:
        context = get_invitation_page_context(halkhata)
        return {
            "halkhata": halkhata,
            "totalActiveCustomers": context.total_active_customers,
            "totalDueCustomers": context.total_due_customers,
            "canGenerate": context.can_generate,
            "generationCount": context.generation_count,
            "latestGenerationId": context.latest_generation_id,
        }


class HalkhataInvitationGenerationListSerializer(serializers.ModelSerializer):
    generatedByName = serializers.SerializerMethodField()
    customerSelectionMode = serializers.CharField(source="customer_selection_mode")
    customerCount = serializers.IntegerField(source="customer_count")
    selectedCustomerIds = serializers.JSONField(source="selected_customer_ids")
    generatedAt = serializers.DateTimeField(source="generated_at")
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")

    class Meta:
        model = HalkhataInvitationGeneration
        fields = [
            "id",
            "generatedByName",
            "generatedAt",
            "customerSelectionMode",
            "customerCount",
            "selectedCustomerIds",
            "status",
            "notes",
            "createdAt",
            "updatedAt",
        ]

    def get_generatedByName(self, obj: HalkhataInvitationGeneration) -> str | None:
        return _actor_name(obj.generated_by)


class HalkhataInvitationRecipientSnapshotSerializer(serializers.ModelSerializer):
    customerId = serializers.IntegerField(source="customer_id")
    customerNameSnapshot = serializers.CharField(source="customer_name_snapshot")
    phoneSnapshot = serializers.CharField(source="phone_snapshot")
    addressSnapshot = serializers.CharField(source="address_snapshot")
    fatherNameSnapshot = serializers.CharField(source="father_name_snapshot")
    dueAmountSnapshot = serializers.DecimalField(
        source="due_amount_snapshot",
        max_digits=14,
        decimal_places=2,
    )
    memoPageNumberSnapshot = serializers.CharField(source="memo_page_number_snapshot")
    sortOrder = serializers.IntegerField(source="sort_order")

    class Meta:
        model = HalkhataInvitationRecipientSnapshot
        fields = [
            "customerId",
            "customerNameSnapshot",
            "phoneSnapshot",
            "addressSnapshot",
            "fatherNameSnapshot",
            "dueAmountSnapshot",
            "memoPageNumberSnapshot",
            "sortOrder",
        ]


class HalkhataInvitationGenerationDetailSerializer(HalkhataInvitationGenerationListSerializer):
    halkhataId = serializers.IntegerField(source="halkhata_id")
    halkhataTitle = serializers.CharField(source="halkhata.title")
    halkhataDate = serializers.DateField(source="halkhata.date")
    recipients = HalkhataInvitationRecipientSnapshotSerializer(many=True)

    class Meta(HalkhataInvitationGenerationListSerializer.Meta):
        fields = [
            *HalkhataInvitationGenerationListSerializer.Meta.fields,
            "halkhataId",
            "halkhataTitle",
            "halkhataDate",
            "recipients",
        ]


class HalkhataInvitationGenerationWriteSerializer(serializers.Serializer):
    selectionMode = serializers.ChoiceField(choices=HalkhataInvitationSelectionMode.choices)
    customerIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
        default=list,
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        selection_mode = attrs["selectionMode"]
        customer_ids = attrs.get("customerIds") or []
        if selection_mode == HalkhataInvitationSelectionMode.MANUAL and not customer_ids:
            raise serializers.ValidationError(
                {"customerIds": "Select at least one customer for manual selection."}
            )
        return attrs

    def create(self, validated_data):
        halkhata: Halkhata = self.context["halkhata"]
        request = self.context["request"]
        return create_invitation_generation(
            halkhata=halkhata,
            user=request.user,
            selection_mode=validated_data["selectionMode"],
            customer_ids=validated_data.get("customerIds"),
            notes=validated_data.get("notes", ""),
        )
