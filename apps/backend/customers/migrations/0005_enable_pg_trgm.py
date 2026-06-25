from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0004_customer_search_indexes"),
    ]

    operations = [
        TrigramExtension(),
    ]
