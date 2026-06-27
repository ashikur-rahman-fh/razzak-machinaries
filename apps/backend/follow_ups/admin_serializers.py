from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.admin.serializers import display_name_for_user
from follow_ups.models import CustomerFollowUp, FollowUpStatus
from follow_ups.services import (
    cancel_follow_up,
    complete_follow_up,
    create_follow_up,
    follow_up_timing_flags,
    update_follow_up,
)

User = get_user_model()


def _actor_name(user) -> str | None:
    if user is None:
        return None
    name = display_name_for_user(user)
    return name or user.get_username()


class CustomerFollowUpReadSerializer(serializers.ModelSerializer):
    customerId = serializers.IntegerField(source="customer_id", read_only=True)
    followUpDate = serializers.DateField(source="follow_up_date")
    status = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True)
    completionNote = serializers.CharField(source="completion_note", read_only=True)
    assignedToId = serializers.IntegerField(
        source="assigned_to_id", read_only=True, allow_null=True
    )
    assignedToName = serializers.SerializerMethodField()
    createdById = serializers.IntegerField(source="created_by_id", read_only=True, allow_null=True)
    createdByName = serializers.SerializerMethodField()
    completedById = serializers.IntegerField(
        source="completed_by_id", read_only=True, allow_null=True
    )
    completedByName = serializers.SerializerMethodField()
    completedAt = serializers.DateTimeField(source="completed_at", read_only=True, allow_null=True)
    rescheduledFromId = serializers.IntegerField(
        source="rescheduled_from_id",
        read_only=True,
        allow_null=True,
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    isOverdue = serializers.SerializerMethodField()
    isToday = serializers.SerializerMethodField()

    class Meta:
        model = CustomerFollowUp
        fields = [
            "id",
            "customerId",
            "followUpDate",
            "status",
            "note",
            "completionNote",
            "assignedToId",
            "assignedToName",
            "createdById",
            "createdByName",
            "completedById",
            "completedByName",
            "completedAt",
            "rescheduledFromId",
            "createdAt",
            "updatedAt",
            "isOverdue",
            "isToday",
        ]

    def get_assignedToName(self, obj: CustomerFollowUp) -> str | None:
        return _actor_name(obj.assigned_to)

    def get_createdByName(self, obj: CustomerFollowUp) -> str | None:
        return _actor_name(obj.created_by)

    def get_completedByName(self, obj: CustomerFollowUp) -> str | None:
        return _actor_name(obj.completed_by)

    def get_isOverdue(self, obj: CustomerFollowUp) -> bool:
        if obj.status != FollowUpStatus.PENDING:
            return False
        is_overdue, _ = follow_up_timing_flags(obj.follow_up_date)
        return is_overdue

    def get_isToday(self, obj: CustomerFollowUp) -> bool:
        if obj.status != FollowUpStatus.PENDING:
            return False
        _, is_today = follow_up_timing_flags(obj.follow_up_date)
        return is_today


class CustomerFollowUpsResponseSerializer(serializers.Serializer):
    active = CustomerFollowUpReadSerializer(allow_null=True)
    history = CustomerFollowUpReadSerializer(many=True)


class CustomerFollowUpWriteSerializer(serializers.Serializer):
    followUpDate = serializers.DateField(required=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    assignedToId = serializers.IntegerField(required=False, allow_null=True)

    def validate_assignedToId(self, value):
        if value is None:
            return None
        if not User.objects.filter(pk=value, is_staff=True, is_active=True).exists():
            raise serializers.ValidationError("Assigned staff user was not found.")
        return value

    def create(self, validated_data):
        customer = self.context["customer"]
        request = self.context["request"]
        assigned_to = None
        assigned_to_id = validated_data.get("assignedToId")
        if assigned_to_id is not None:
            assigned_to = User.objects.get(pk=assigned_to_id)

        return create_follow_up(
            customer=customer,
            follow_up_date=validated_data["followUpDate"],
            note=validated_data.get("note", ""),
            actor=request.user,
            assigned_to=assigned_to,
        )


class CustomerFollowUpUpdateSerializer(serializers.Serializer):
    followUpDate = serializers.DateField(required=False)
    note = serializers.CharField(required=False, allow_blank=True)
    assignedToId = serializers.IntegerField(required=False, allow_null=True)

    def validate_assignedToId(self, value):
        if value is None:
            return None
        if not User.objects.filter(pk=value, is_staff=True, is_active=True).exists():
            raise serializers.ValidationError("Assigned staff user was not found.")
        return value

    def update(self, instance: CustomerFollowUp, validated_data):
        request = self.context["request"]
        assigned_to = None
        if "assignedToId" in validated_data:
            assigned_to_id = validated_data["assignedToId"]
            assigned_to = (
                User.objects.get(pk=assigned_to_id) if assigned_to_id is not None else None
            )

        return update_follow_up(
            instance,
            follow_up_date=validated_data.get("followUpDate"),
            note=validated_data.get("note"),
            actor=request.user,
            assigned_to=assigned_to,
        )


class CustomerFollowUpCompleteSerializer(serializers.Serializer):
    completionNote = serializers.CharField(required=False, allow_blank=True, default="")

    def save(self, **kwargs):
        follow_up = self.context["follow_up"]
        request = self.context["request"]
        return complete_follow_up(
            follow_up,
            actor=request.user,
            completion_note=self.validated_data.get("completionNote", ""),
        )


class CustomerFollowUpCancelSerializer(serializers.Serializer):
    def save(self, **kwargs):
        follow_up = self.context["follow_up"]
        request = self.context["request"]
        return cancel_follow_up(follow_up, actor=request.user)


class DashboardFollowUpCustomerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    fullNameBn = serializers.CharField()
    fullNameEn = serializers.CharField()
    phone = serializers.CharField()
    addressBn = serializers.CharField()
    addressEn = serializers.CharField()
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)


class DashboardFollowUpItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    followUpDate = serializers.DateField()
    isOverdue = serializers.BooleanField()
    isToday = serializers.BooleanField()
    note = serializers.CharField()
    assignedToName = serializers.CharField(allow_null=True)
    createdByName = serializers.CharField(allow_null=True)
    customer = DashboardFollowUpCustomerSerializer()


class DashboardFollowUpsResponseSerializer(serializers.Serializer):
    items = DashboardFollowUpItemSerializer(many=True)
