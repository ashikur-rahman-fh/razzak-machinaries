import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import Q

import customers.storage


def backfill_customer_versions(apps, schema_editor):
    Customer = apps.get_model("customers", "Customer")
    CustomerVersion = apps.get_model("customers", "CustomerVersion")
    for customer in Customer.objects.all().iterator():
        CustomerVersion.objects.create(
            customer=customer,
            version_number=1,
            previous_version=None,
            is_current=True,
            full_name_bn=customer.full_name_bn,
            full_name_en=customer.full_name_en,
            address_bn=customer.address_bn,
            address_en=customer.address_en,
            phone_bn=customer.phone_bn,
            phone_en=customer.phone_en,
            father_name_bn=customer.father_name_bn,
            father_name_en=customer.father_name_en,
            memo_page_number_bn=customer.memo_page_number_bn,
            memo_page_number_en=customer.memo_page_number_en,
            mediator_name_bn=customer.mediator_name_bn,
            mediator_name_en=customer.mediator_name_en,
            profile_picture=customer.profile_picture,
            change_reason="",
        )


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0007_customer_cached_balance"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="archive_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="customer",
            name="archived_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="customer",
            name="archived_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="archived_customers",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="customer",
            name="is_archived",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.CreateModel(
            name="CustomerVersion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("version_number", models.PositiveIntegerField(default=1)),
                ("is_current", models.BooleanField(db_index=True, default=True)),
                ("full_name_bn", models.CharField(max_length=255)),
                ("full_name_en", models.CharField(max_length=255)),
                ("address_bn", models.TextField()),
                ("address_en", models.TextField()),
                ("phone_bn", models.CharField(max_length=20)),
                ("phone_en", models.CharField(max_length=20)),
                ("father_name_bn", models.CharField(max_length=255)),
                ("father_name_en", models.CharField(max_length=255)),
                ("memo_page_number_bn", models.CharField(max_length=32)),
                ("memo_page_number_en", models.CharField(max_length=32)),
                ("mediator_name_bn", models.CharField(blank=True, default="", max_length=255)),
                ("mediator_name_en", models.CharField(blank=True, default="", max_length=255)),
                (
                    "profile_picture",
                    models.ImageField(
                        blank=True,
                        null=True,
                        upload_to=customers.storage.customer_profile_upload_path,
                    ),
                ),
                ("change_reason", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_customer_versions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="customers.customer",
                    ),
                ),
                (
                    "previous_version",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="next_versions",
                        to="customers.customerversion",
                    ),
                ),
            ],
            options={
                "ordering": ["customer_id", "version_number"],
            },
        ),
        migrations.AddIndex(
            model_name="customerversion",
            index=models.Index(fields=["customer", "is_current"], name="customers_c_custome_0d0f0d_idx"),
        ),
        migrations.AddConstraint(
            model_name="customerversion",
            constraint=models.UniqueConstraint(
                condition=Q(("is_current", True)),
                fields=("customer",),
                name="uniq_current_customer_version",
            ),
        ),
        migrations.RunPython(backfill_customer_versions, migrations.RunPython.noop),
    ]
