from decimal import Decimal

from rest_framework import serializers

from customers.models import Customer
from transactions.filters import get_balance_impact
from transactions.models import PaymentMethod, Transaction, TransactionItem, TransactionType
from transactions.services import create_transaction


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
        if not Customer.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Customer not found.")
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


class TransactionReadSerializer(serializers.ModelSerializer):
    customerId = serializers.IntegerField(source="customer_id")
    customerNameBn = serializers.CharField(source="customer.full_name_bn", read_only=True)
    customerNameEn = serializers.CharField(source="customer.full_name_en", read_only=True)
    transactionType = serializers.CharField(source="transaction_type")
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2)
    paymentMethod = serializers.CharField(source="payment_method", read_only=True)
    balanceImpact = serializers.SerializerMethodField()
    items = TransactionItemReadSerializer(many=True, read_only=True)
    createdByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "customerId",
            "customerNameBn",
            "customerNameEn",
            "transactionType",
            "date",
            "amount",
            "totalAmount",
            "note",
            "paymentMethod",
            "balanceImpact",
            "items",
            "createdByName",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = fields

    def get_balanceImpact(self, obj: Transaction) -> str:
        return get_balance_impact(obj.transaction_type, obj.total_amount)

    def get_createdByName(self, obj: Transaction) -> str | None:
        if obj.created_by is None:
            return None
        return obj.created_by.get_username()


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


class CustomerBalanceSerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    currentBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalInitial = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalSales = serializers.DecimalField(max_digits=14, decimal_places=2)
    totalPayments = serializers.DecimalField(max_digits=14, decimal_places=2)
    transactionCount = serializers.IntegerField()
    cachedBalance = serializers.DecimalField(max_digits=14, decimal_places=2)
