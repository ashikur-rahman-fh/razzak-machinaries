from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0003_alter_customer_memo_page_number_bn_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customer",
            name="mediator_name_bn",
            field=models.CharField(blank=True, db_index=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="customer",
            name="mediator_name_en",
            field=models.CharField(blank=True, db_index=True, default="", max_length=255),
        ),
    ]
