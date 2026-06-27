import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("halkhata", "0001_initial"),
        ("transactions", "0004_rename_transaction_custome_5f0a8a_idx_transaction_custome_99a7e5_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="halkhata",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="transactions",
                to="halkhata.halkhata",
            ),
        ),
        migrations.AddIndex(
            model_name="transaction",
            index=models.Index(
                fields=["halkhata", "is_current", "status"],
                name="transaction_halkhat_8a1c2d_idx",
            ),
        ),
    ]
