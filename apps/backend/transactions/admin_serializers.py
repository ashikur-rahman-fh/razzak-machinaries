from decimal import Decimal

from rest_framework import serializers

from customers.models import Customer
from transactions.exceptions import CorrectionNotAllowed, VoidNotAllowed
from transactions.filters import get_balance_impact
from transactions.models import (
    PaymentMethod,
    Transaction,
    TransactionItem,
    TransactionStatus,
    TransactionType,
)
from transactions.services import (
    create_transaction,
    create_transaction_correction,
    void_transaction,
)


class TransactionItemWriteSerializer(serializers.Serializer):
    productName = serializers.CharField(source="product_name")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)


class TransactionItemReadSerializer(serializers.ModelSerializer):
    productName = serializers.CharField(source="product_name")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2)
    lineTotal = serializers.DecimalField(source="line_total", max_digits=12, decimal_places=2)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = TransactionItem
        fields = [
            "id",
            "productName",
            "unitPrice",
            "quantity",
            "lineTotal",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = fields


class TransactionWriteSerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    transactionType = serializers.ChoiceField(choices=TransactionType.choices)
    date = serializers.DateField()
    note = serializers.CharField(required=False, allow_blank=True, default="")
    paymentMethod = serializers.ChoiceField(
        choices=PaymentMethod.choices,
        required=False,
        allow_blank=True,
        default="",
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    items = TransactionItemWriteSerializer(many=True, required=False)

    def validate_customerId(self, value: int) -> int:
        customer = Customer.objects.filter(pk=value).first()
        if customer is None:
            raise serializers.ValidationError("Customer not found.")
        if customer.is_archived:
            raise serializers.ValidationError("Archived customers cannot have new transactions.")
        return value

    def validate(self, attrs):
        transaction_type = attrs.get("transactionType")
        amount = attrs.get("amount")
        items = attrs.get("items")

        if transaction_type == TransactionType.SALE:
            if not items:
                raise serializers.ValidationError(
                    {"items": "Sale transactions require at least one item."}
                )
            if amount is not None:
                raise serializers.ValidationError(
                    {"amount": "Amount must not be sent for sale transactions."}
                )
        elif transaction_type in (TransactionType.INITIAL, TransactionType.PAYMENT):
            if items:
                raise serializers.ValidationError(
                    {"items": "Items are only allowed for sale transactions."}
                )
            if amount is None:
                raise serializers.ValidationError({"amount": "Amount is required."})
            if amount <= Decimal("0"):
                raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
            if transaction_type == TransactionType.INITIAL and attrs.get("paymentMethod"):
                raise serializers.ValidationError(
                    {"paymentMethod": "Payment method is only allowed for payment transactions."}
                )

        return attrs

    def create(self, validated_data):
        customer = Customer.objects.get(pk=validated_data["customerId"])
        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None

        items = validated_data.get("items")
        normalized_items = None
        if items:
            normalized_items = [
                {
                    "product_name": item["product_name"],
                    "unit_price": item["unit_price"],
                    "quantity": item["quantity"],
                }
                for item in items
            ]

        return create_transaction(
            customer=customer,
            transaction_type=validated_data["transactionType"],
            date=validated_data["date"],
            note=validated_data.get("note", ""),
            payment_method=validated_data.get("paymentMethod", ""),
            amount=validated_data.get("amount"),
            items=normalized_items,
            created_by=created_by,
        )


class TransactionCorrectionWriteSerializer(serializers.Serializer):
    transactionType = serializers.ChoiceField(
        choices=TransactionType.choices,
        required=False,
    )
    date = serializers.DateField(required=False)
    note = serializers.CharField(required=False, allow_blank=True)
    paymentMethod = serializers.ChoiceField(
        choices=PaymentMethod.choices,
        required=False,
        allow_blank=True,
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    items = TransactionItemWriteSerializer(many=True, required=False)
    editReason = serializers.CharField()

    def validate_editReason(self, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise serializers.ValidationError("Reason for change is required.")
        return normalized

    def validate(self, attrs):
        source: Transaction = self.context["source"]
        transaction_type = attrs.get("transactionType", source.transaction_type)
        amount = attrs.get("amount")
        items = attrs.get("items")

        if transaction_type == TransactionType.SALE:
            if items is not None and not items:
                raise serializers.ValidationError(
                    {"items": "Sale transactions require at least one item."}
                )
            if amount is not None:
                raise serializers.ValidationError(
                    {"amount": "Amount must not be sent for sale transactions."}
                )
        elif transaction_type in (TransactionType.INITIAL, TransactionType.PAYMENT):
            if items:
                raise serializers.ValidationError(
                    {"items": "Items are only allowed for sale transactions."}
                )
            if amount is not None and amount <= Decimal("0"):
                raise serializers.ValidationError({"amount": "Amount must be greater than zero."})

        return attrs

    def save(self):
        source: Transaction = self.context["source"]
        request = self.context.get("request")
        edited_by = request.user if request and request.user.is_authenticated else None
        validated = self.validated_data

        items = validated.get("items")
        normalized_items = None
        if items is not None:
            normalized_items = [
                {
                    "product_name": item["product_name"],
                    "unit_price": item["unit_price"],
                    "quantity": item["quantity"],
                }
                for item in items
            ]

        try:
            return create_transaction_correction(
                source=source,
                edit_reason=validated["editReason"],
                edited_by=edited_by,
                transaction_type=validated.get("transactionType"),
                date=validated.get("date"),
                note=validated.get("note"),
                payment_method=validated.get("paymentMethod"),
                amount=validated.get("amount"),
                items=normalized_items,
            )
        except ValueError as exc:
            raise CorrectionNotAllowed(str(exc)) from exc


class TransactionVoidSerializer(serializers.Serializer):
    voidReason = serializers.CharField()

    def validate_voidReason(self, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise serializers.ValidationError("Void reason is required.")
        return normalized

    def save(self):
        source: Transaction = self.context["source"]
        request = self.context.get("request")
        voided_by = request.user if request and request.user.is_authenticated else None
        try:
            return void_transaction(
                source=source,
                void_reason=self.validated_data["voidReason"],
                voided_by=voided_by,
            )
        except ValueError as exc:
            raise VoidNotAllowed(str(exc)) from exc


class TransactionReadSerializer(serializers.ModelSerializer):
    customerId = serializers.IntegerField(source="customer_id")
    customerNameBn = serializers.SerializerMethodField()
    customerNameEn = serializers.SerializerMethodField()
    transactionType = serializers.CharField(source="transaction_type")
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2)
    paymentMethod = serializers.CharField(source="payment_method", read_only=True)
    displayId = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    isCurrent = serializers.BooleanField(source="is_current", read_only=True)
    versionNumber = serializers.IntegerField(source="version_number", read_only=True)
    rootTransactionId = serializers.IntegerField(source="root_transaction_id", read_only=True)
    previousVersionId = serializers.IntegerField(source="previous_version_id", read_only=True)
    editedFromId = serializers.IntegerField(source="edited_from_id", read_only=True)
    nextVersionId = serializers.SerializerMethodField()
    latestVersionId = serializers.SerializerMethodField()
    editReason = serializers.CharField(source="edit_reason", read_only=True)
    editedByName = serializers.SerializerMethodField()
    editedAt = serializers.DateTimeField(source="edited_at", read_only=True)
    voidReason = serializers.CharField(source="void_reason", read_only=True)
    voidedByName = serializers.SerializerMethodField()
    voidedAt = serializers.DateTimeField(source="voided_at", read_only=True)
    customerNameSnapshotBn = serializers.CharField(source="customer_name_bn", read_only=True)
    customerNameSnapshotEn = serializers.CharField(source="customer_name_en", read_only=True)
    customerAddressSnapshotBn = serializers.CharField(source="customer_address_bn", read_only=True)
    customerAddressSnapshotEn = serializers.CharField(source="customer_address_en", read_only=True)
    customerPhoneSnapshot = serializers.CharField(source="customer_phone", read_only=True)
    balanceImpact = serializers.SerializerMethodField()
    items = TransactionItemReadSerializer(many=True, read_only=True)
    createdByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "displayId",
            "customerId",
            "customerNameBn",
            "customerNameEn",
            "customerNameSnapshotBn",
            "customerNameSnapshotEn",
            "customerAddressSnapshotBn",
            "customerAddressSnapshotEn",
            "customerPhoneSnapshot",
            "transactionType",
            "date",
            "amount",
            "totalAmount",
            "note",
            "paymentMethod",
            "status",
            "isCurrent",
            "versionNumber",
            "rootTransactionId",
            "previousVersionId",
            "editedFromId",
            "nextVersionId",
            "latestVersionId",
            "editReason",
            "editedByName",
            "editedAt",
            "voidReason",
            "voidedByName",
            "voidedAt",
            "balanceImpact",
            "items",
            "createdByName",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = fields

    def get_customerNameBn(self, obj: Transaction) -> str:
        return obj.customer_name_bn or obj.customer.full_name_bn

    def get_customerNameEn(self, obj: Transaction) -> str:
        return obj.customer_name_en or obj.customer.full_name_en

    def get_displayId(self, obj: Transaction) -> str:
        return obj.display_id

    def get_nextVersionId(self, obj: Transaction) -> int | None:
        next_version = obj.next_versions.order_by("version_number", "id").first()
        return next_version.pk if next_version else None

    def get_latestVersionId(self, obj: Transaction) -> int:
        root_id = obj.root_transaction_id or obj.pk
        latest = (
            Transaction.objects.filter(root_transaction_id=root_id)
            .order_by("-version_number", "-id")
            .first()
        )
        return latest.pk if latest else obj.pk

    def get_balanceImpact(self, obj: Transaction) -> str:
        if not obj.is_current or obj.status != TransactionStatus.ACTIVE:
            return "+0.00" if obj.transaction_type != TransactionType.PAYMENT else "-0.00"
        return get_balance_impact(obj.transaction_type, obj.total_amount)

    def get_createdByName(self, obj: Transaction) -> str | None:
        if obj.created_by is None:
            return None
        return obj.created_by.get_username()

    def get_editedByName(self, obj: Transaction) -> str | None:
        if obj.edited_by is None:
            return None
        return obj.edited_by.get_username()

    def get_voidedByName(self, obj: Transaction) -> str | None:
        if obj.voided_by is None:
            return None
        return obj.voided_by.get_username()


class TransactionHistorySerializer(serializers.Serializer):
    rootTransactionId = serializers.IntegerField()
    versions = TransactionReadSerializer(many=True)


class TransactionConfirmationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    displayId = serializers.CharField()
    transactionType = serializers.CharField()
    date = serializers.DateField()
    totalAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    note = serializers.CharField()
    paymentMethod = serializers.CharField()
    customerId = serializers.IntegerField()
    customerNameBn = serializers.CharField()
    customerNameEn = serializers.CharField()
    customerAddressBn = serializers.CharField()
    customerAddressEn = serializers.CharField()
    customerPhone = serializers.CharField()
    items = TransactionItemReadSerializer(many=True)
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
    status = serializers.CharField()
    isCurrent = serializers.BooleanField()
    versionNumber = serializers.IntegerField()
    latestVersionId = serializers.IntegerField()
    isHistorical = serializers.BooleanField()
    previousVersionId = serializers.IntegerField(allow_null=True)
    editReason = serializers.CharField(allow_blank=True)
    voidReason = serializers.CharField(allow_blank=True)


class CustomerBalanceSerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalInitial = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalSales = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalPayments = serializers.DecimalField(max_digits=14, decimal_places=2)
    transactionCount = serializers.IntegerField()
    cachedBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
