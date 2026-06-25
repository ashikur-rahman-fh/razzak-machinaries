from django.contrib.postgres.indexes import GinIndex
from django.db import models

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
