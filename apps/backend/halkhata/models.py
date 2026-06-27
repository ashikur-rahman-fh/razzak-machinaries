from django.conf import settings
from django.db import models


class HalkhataInvitationSelectionMode(models.TextChoices):
    MANUAL = "manual", "Manual"
    ALL_ACTIVE = "all_active", "All active customers"
    DUE_ONLY = "due_only", "Customers with due only"


class HalkhataInvitationGenerationStatus(models.TextChoices):
    GENERATED = "generated", "Generated"


class HalkhataStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"


class Halkhata(models.Model):
    title = models.CharField(max_length=255)
    date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=16,
        choices=HalkhataStatus.choices,
        default=HalkhataStatus.ACTIVE,
        db_index=True,
    )
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_halkhatas",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name_plural = "halkhatas"

    def __str__(self) -> str:
        return f"{self.title} ({self.date})"


class HalkhataInvitationGeneration(models.Model):
    halkhata = models.ForeignKey(
        Halkhata,
        on_delete=models.CASCADE,
        related_name="invitation_generations",
    )
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="halkhata_invitation_generations",
    )
    generated_at = models.DateTimeField(auto_now_add=True, db_index=True)
    customer_selection_mode = models.CharField(
        max_length=16,
        choices=HalkhataInvitationSelectionMode.choices,
    )
    customer_count = models.PositiveIntegerField()
    selected_customer_ids = models.JSONField(default=list)
    status = models.CharField(
        max_length=16,
        choices=HalkhataInvitationGenerationStatus.choices,
        default=HalkhataInvitationGenerationStatus.GENERATED,
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-generated_at", "-id"]
        indexes = [
            models.Index(fields=["halkhata", "-generated_at"]),
        ]

    def __str__(self) -> str:
        return f"Invitation generation {self.pk} for {self.halkhata_id}"


class HalkhataInvitationRecipientSnapshot(models.Model):
    generation = models.ForeignKey(
        HalkhataInvitationGeneration,
        on_delete=models.CASCADE,
        related_name="recipients",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="halkhata_invitation_snapshots",
    )
    customer_name_snapshot = models.CharField(max_length=255)
    phone_snapshot = models.CharField(max_length=32)
    address_snapshot = models.TextField()
    father_name_snapshot = models.CharField(max_length=255, blank=True, default="")
    due_amount_snapshot = models.DecimalField(max_digits=14, decimal_places=2)
    memo_page_number_snapshot = models.CharField(max_length=32, blank=True, default="")
    sort_order = models.PositiveIntegerField()

    class Meta:
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(fields=["generation", "sort_order"]),
        ]

    def __str__(self) -> str:
        return f"Snapshot for customer {self.customer_id} in generation {self.generation_id}"
