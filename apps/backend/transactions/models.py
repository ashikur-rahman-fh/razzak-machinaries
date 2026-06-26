from django.conf import settings
from django.db import models
from django.db.models import Q


class TransactionType(models.TextChoices):
    INITIAL = "INITIAL", "Initial Balance"
    SALE = "SALE", "Sale"
    PAYMENT = "PAYMENT", "Payment"


class TransactionStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUPERSEDED = "SUPERSEDED", "Superseded"
    VOIDED = "VOIDED", "Voided"


class PaymentMethod(models.TextChoices):
    CASH = "cash", "Cash"
    BANK = "bank", "Bank"
    BKASH = "bkash", "bKash"
    NAGAD = "nagad", "Nagad"
    OTHER = "other", "Other"


class Transaction(models.Model):
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=16, choices=TransactionType.choices)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True, default="")
    payment_method = models.CharField(
        max_length=16,
        choices=PaymentMethod.choices,
        blank=True,
        default="",
    )
    status = models.CharField(
        max_length=16,
        choices=TransactionStatus.choices,
        default=TransactionStatus.ACTIVE,
        db_index=True,
    )
    is_current = models.BooleanField(default=True, db_index=True)
    version_number = models.PositiveIntegerField(default=1)
    root_transaction = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="chain_versions",
    )
    previous_version = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="next_versions",
    )
    edited_from = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="corrections",
    )
    edit_reason = models.TextField(blank=True, default="")
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edited_transactions",
    )
    edited_at = models.DateTimeField(null=True, blank=True)
    void_reason = models.TextField(blank=True, default="")
    voided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="voided_transactions",
    )
    voided_at = models.DateTimeField(null=True, blank=True)
    customer_name_bn = models.CharField(max_length=255, blank=True, default="")
    customer_name_en = models.CharField(max_length=255, blank=True, default="")
    customer_address_bn = models.TextField(blank=True, default="")
    customer_address_en = models.TextField(blank=True, default="")
    customer_phone = models.CharField(max_length=20, blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["customer", "date"]),
            models.Index(fields=["customer", "transaction_type"]),
            models.Index(fields=["transaction_type", "date"]),
            models.Index(fields=["customer", "is_current", "status"]),
            models.Index(fields=["root_transaction", "version_number"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["root_transaction"],
                condition=Q(is_current=True),
                name="uniq_current_transaction_per_root",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.transaction_type} #{self.pk} — customer {self.customer_id}"

    @property
    def display_id(self) -> str:
        return f"COM-{self.pk}"


class TransactionItem(models.Model):
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.product_name} x {self.quantity}"
