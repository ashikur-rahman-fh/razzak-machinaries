from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0006_customer_trigram_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="cached_balance",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=14),
        ),
    ]
