import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import Q


def _customer_phone(customer):
    return customer.phone or customer.phone_bn or customer.phone_en or ""


def backfill_transaction_versions(apps, schema_editor):
    Transaction = apps.get_model("transactions", "Transaction")
    for transaction in Transaction.objects.select_related("customer").all().iterator():
        customer = transaction.customer
        transaction.status = "ACTIVE"
        transaction.is_current = True
        transaction.version_number = 1
        transaction.root_transaction_id = transaction.pk
        transaction.customer_name_bn = customer.full_name_bn
        transaction.customer_name_en = customer.full_name_en
        transaction.customer_address_bn = customer.address_bn
        transaction.customer_address_en = customer.address_en
        transaction.customer_phone = _customer_phone(customer)
        transaction.save(
            update_fields=[
                "status",
                "is_current",
                "version_number",
                "root_transaction",
                "customer_name_bn",
                "customer_name_en",
                "customer_address_bn",
                "customer_address_en",
                "customer_phone",
            ]
        )


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0002_rename_transaction_custome_0f8e2d_idx_transaction_custome_70b027_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="customer_address_bn",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="transaction",
            name="customer_address_en",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="transaction",
            name="customer_name_bn",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="transaction",
            name="customer_name_en",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="transaction",
            name="customer_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="transaction",
            name="edit_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="transaction",
            name="edited_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="transaction",
            name="edited_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="edited_transactions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="edited_from",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="corrections",
                to="transactions.transaction",
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="is_current",
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name="transaction",
            name="previous_version",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="next_versions",
                to="transactions.transaction",
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="root_transaction",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="chain_versions",
                to="transactions.transaction",
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="status",
            field=models.CharField(
                choices=[("ACTIVE", "Active"), ("SUPERSEDED", "Superseded"), ("VOIDED", "Voided")],
                db_index=True,
                default="ACTIVE",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="version_number",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="transaction",
            name="void_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="transaction",
            name="voided_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="transaction",
            name="voided_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="voided_transactions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(backfill_transaction_versions, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["customer", "is_current", "status"],
                name="transaction_custome_5f0a8a_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["root_transaction", "version_number"],
                name="transaction_root_tr_7d2f1e_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="transaction",
            constraint=models.UniqueConstraint(
                condition=Q(("is_current", True)),
                fields=("root_transaction",),
                name="uniq_current_transaction_per_root",
            ),
        ),
    ]
