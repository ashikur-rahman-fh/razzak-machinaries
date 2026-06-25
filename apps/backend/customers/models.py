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
    mediator_name_bn = models.CharField(max_length=255, blank=True, default="")
    mediator_name_en = models.CharField(max_length=255, blank=True, default="")
    profile_picture = models.ImageField(
        upload_to=customer_profile_upload_path,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.full_name_bn
