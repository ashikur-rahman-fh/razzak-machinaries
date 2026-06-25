from django.conf import settings
from django.db import models


class TransactionType(models.TextChoices):
    INITIAL = "INITIAL", "Initial Balance"
    SALE = "SALE", "Sale"
    PAYMENT = "PAYMENT", "Payment"


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
        ]

    def __str__(self) -> str:
        return f"{self.transaction_type} #{self.pk} — customer {self.customer_id}"


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
