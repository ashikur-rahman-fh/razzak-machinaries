from django.db import migrations, models


def backfill_bilingual_phone_fields(apps, schema_editor):
    Customer = apps.get_model("customers", "Customer")
    for customer in Customer.objects.all():
        phone = customer.phone or ""
        if phone.startswith("+880"):
            customer.phone_en = f"0{phone[4:]}"
        elif phone.startswith("880"):
            customer.phone_en = f"0{phone[3:]}"
        else:
            customer.phone_en = phone
        customer.save(update_fields=["phone_en"])


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="phone_bn",
            field=models.CharField(default="", max_length=20),
        ),
        migrations.AddField(
            model_name="customer",
            name="phone_en",
            field=models.CharField(default="", max_length=20),
        ),
        migrations.RenameField(
            model_name="customer",
            old_name="memo_page_number",
            new_name="memo_page_number_en",
        ),
        migrations.AddField(
            model_name="customer",
            name="memo_page_number_bn",
            field=models.CharField(db_index=True, default="", max_length=32),
        ),
        migrations.RunPython(backfill_bilingual_phone_fields, migrations.RunPython.noop),
    ]
