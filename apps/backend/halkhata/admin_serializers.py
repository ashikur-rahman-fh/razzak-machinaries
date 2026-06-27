from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from api.admin.serializers import display_name_for_user
from customers.models import Customer
from halkhata.models import Halkhata, HalkhataStatus
from halkhata.services import (
    compute_halkhata_stats,
    create_halkhata,
    create_halkhata_payment,
    update_halkhata,
)
from transactions.models import Transaction


def _actor_name(user) -> str | None:
    if user is None:
        return None
    name = display_name_for_user(user)
    return name or user.get_username()


class HalkhataStatsSerializer(serializers.Serializer):
    totalCollected = serializers.DecimalField(max_digits=14, decimal_places=2)
    paymentCount = serializers.IntegerField()
    averagePayment = serializers.DecimalField(max_digits=14, decimal_places=2)
    highestPayment = serializers.DecimalField(max_digits=14, decimal_places=2)
    uniqueCustomersPaid = serializers.IntegerField()
    todayCollection = serializers.DecimalField(max_digits=14, decimal_places=2)
    remainingDueOfPaidCustomers = serializers.DecimalField(max_digits=14, decimal_places=2)


def _stats_payload(stats) -> dict:
    return {
        "totalCollected": stats.total_collected,
        "paymentCount": stats.payment_count,
        "averagePayment": stats.average_payment,
        "highestPayment": stats.highest_payment,
        "uniqueCustomersPaid": stats.unique_customers_paid,
        "todayCollection": stats.today_collection,
        "remainingDueOfPaidCustomers": stats.remaining_due_of_paid_customers,
    }


def _get_or_compute_halkhata_stats(obj: Halkhata):
    cached = getattr(obj, "_computed_halkhata_stats", None)
    if cached is None:
        cached = compute_halkhata_stats(obj)
        obj._computed_halkhata_stats = cached
    return cached


class HalkhataReadSerializer(serializers.ModelSerializer):
    createdByName = serializers.SerializerMethodField()
    totalCollected = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
        required=False,
        default=Decimal("0"),
    )
    paymentCount = serializers.IntegerField(read_only=True, required=False, default=0)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Halkhata
        fields = [
            "id",
            "title",
            "date",
            "status",
            "notes",
            "createdByName",
            "createdAt",
            "updatedAt",
            "totalCollected",
            "paymentCount",
        ]

    def get_createdByName(self, obj: Halkhata) -> str | None:
        return _actor_name(obj.created_by)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        stats = _get_or_compute_halkhata_stats(instance)
        data["totalCollected"] = str(stats.total_collected)
        data["paymentCount"] = stats.payment_count
        return data


class HalkhataDetailSerializer(HalkhataReadSerializer):
    stats = serializers.SerializerMethodField()

    class Meta(HalkhataReadSerializer.Meta):
        fields = HalkhataReadSerializer.Meta.fields + ["stats"]

    def get_stats(self, obj: Halkhata) -> dict:
        stats = _get_or_compute_halkhata_stats(obj)
        return HalkhataStatsSerializer(_stats_payload(stats)).data


class HalkhataWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=True, allow_blank=False)
    date = serializers.DateField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_title(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("Halkhata name is required.")
        return stripped

    def create(self, validated_data):
        request = self.context["request"]
        return create_halkhata(
            title=validated_data["title"],
            date=validated_data["date"],
            notes=validated_data.get("notes", ""),
            created_by=request.user,
        )


class HalkhataUpdateSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=[HalkhataStatus.ACTIVE, HalkhataStatus.CLOSED],
        required=False,
    )

    def update(self, instance: Halkhata, validated_data):
        return update_halkhata(
            instance,
            notes=validated_data.get("notes"),
            status=validated_data.get("status"),
        )


class HalkhataPaymentWriteSerializer(serializers.Serializer):
    customerId = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    date = serializers.DateField(required=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    paymentMethod = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= Decimal("0"):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_customerId(self, value: int) -> int:
        if not Customer.objects.filter(pk=value, is_archived=False).exists():
            raise serializers.ValidationError("Customer was not found or is archived.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        halkhata = self.context["halkhata"]
        customer = Customer.objects.get(pk=validated_data["customerId"])
        return create_halkhata_payment(
            halkhata=halkhata,
            customer=customer,
            amount=validated_data["amount"],
            date=validated_data["date"],
            note=validated_data.get("note", ""),
            payment_method=validated_data.get("paymentMethod", ""),
            created_by=request.user,
        )


class HalkhataTransactionSerializer(serializers.ModelSerializer):
    displayId = serializers.CharField(source="display_id", read_only=True)
    paymentNumber = serializers.IntegerField(source="payment_number", read_only=True)
    customerId = serializers.IntegerField(source="customer_id", read_only=True)
    customerNameBn = serializers.CharField(source="customer_name_bn", read_only=True)
    customerNameEn = serializers.CharField(source="customer_name_en", read_only=True)
    customerPhone = serializers.CharField(source="customer_phone", read_only=True)
    totalAmount = serializers.DecimalField(
        source="total_amount",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    createdByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "displayId",
            "paymentNumber",
            "customerId",
            "customerNameBn",
            "customerNameEn",
            "customerPhone",
            "totalAmount",
            "date",
            "note",
            "createdByName",
            "createdAt",
        ]

    def get_createdByName(self, obj: Transaction) -> str | None:
        return _actor_name(obj.created_by)
