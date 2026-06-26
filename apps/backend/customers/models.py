from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models import Q

from customers.storage import customer_profile_upload_path


class Customer(models.Model):
    full_name_bn = models.CharField(max_length=255, db_index=True)
    full_name_en = models.CharField(max_length=255, db_index=True)
    address_bn = models.TextField()
    address_en = models.TextField()
    phone_bn = models.CharField(max_length=20)
    phone_en = models.CharField(max_length=20)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    father_name_bn = models.CharField(max_length=255)
    father_name_en = models.CharField(max_length=255)
    memo_page_number_bn = models.CharField(max_length=32, db_index=True)
    memo_page_number_en = models.CharField(max_length=32, db_index=True)
    mediator_name_bn = models.CharField(max_length=255, blank=True, default="", db_index=True)
    mediator_name_en = models.CharField(max_length=255, blank=True, default="", db_index=True)
    profile_picture = models.ImageField(
        upload_to=customer_profile_upload_path,
        blank=True,
        null=True,
    )
    cached_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archived_customers",
    )
    archive_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            GinIndex(
                fields=["full_name_bn"],
                name="customer_full_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["full_name_en"],
                name="customer_full_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["father_name_bn"],
                name="customer_father_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["father_name_en"],
                name="customer_father_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["address_bn"],
                name="customer_address_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["address_en"],
                name="customer_address_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["mediator_name_bn"],
                name="customer_mediator_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                fields=["mediator_name_en"],
                name="customer_mediator_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self) -> str:
        return self.full_name_bn


class CustomerVersion(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="next_versions",
    )
    is_current = models.BooleanField(default=True, db_index=True)
    full_name_bn = models.CharField(max_length=255)
    full_name_en = models.CharField(max_length=255)
    address_bn = models.TextField()
    address_en = models.TextField()
    phone_bn = models.CharField(max_length=20)
    phone_en = models.CharField(max_length=20)
    father_name_bn = models.CharField(max_length=255)
    father_name_en = models.CharField(max_length=255)
    memo_page_number_bn = models.CharField(max_length=32)
    memo_page_number_en = models.CharField(max_length=32)
    mediator_name_bn = models.CharField(max_length=255, blank=True, default="")
    mediator_name_en = models.CharField(max_length=255, blank=True, default="")
    profile_picture = models.ImageField(
        upload_to=customer_profile_upload_path,
        blank=True,
        null=True,
    )
    change_reason = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_customer_versions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["customer_id", "version_number"]
        indexes = [
            models.Index(fields=["customer", "is_current"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["customer"],
                condition=Q(is_current=True),
                name="uniq_current_customer_version",
            ),
        ]

    def __str__(self) -> str:
        return f"Customer {self.customer_id} v{self.version_number}"
