# Generated manually for Customer model

import customers.storage
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("full_name_bn", models.CharField(db_index=True, max_length=255)),
                ("full_name_en", models.CharField(db_index=True, max_length=255)),
                ("address_bn", models.TextField()),
                ("address_en", models.TextField()),
                ("phone", models.CharField(db_index=True, max_length=20, unique=True)),
                ("father_name_bn", models.CharField(max_length=255)),
                ("father_name_en", models.CharField(max_length=255)),
                ("memo_page_number", models.CharField(db_index=True, max_length=32)),
                (
                    "mediator_name_bn",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                (
                    "mediator_name_en",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                (
                    "profile_picture",
                    models.ImageField(
                        blank=True,
                        null=True,
                        upload_to=customers.storage.customer_profile_upload_path,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
