import django.contrib.postgres.indexes
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0005_enable_pg_trgm"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["full_name_bn"],
                name="customer_full_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["full_name_en"],
                name="customer_full_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["father_name_bn"],
                name="customer_father_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["father_name_en"],
                name="customer_father_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["address_bn"],
                name="customer_address_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["address_en"],
                name="customer_address_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["mediator_name_bn"],
                name="customer_mediator_name_bn_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=django.contrib.postgres.indexes.GinIndex(
                fields=["mediator_name_en"],
                name="customer_mediator_name_en_trgm",
                opclasses=["gin_trgm_ops"],
            ),
        ),
    ]
