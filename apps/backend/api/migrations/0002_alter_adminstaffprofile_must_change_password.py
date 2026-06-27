from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_adminstaffprofile"),
    ]

    operations = [
        migrations.AlterField(
            model_name="adminstaffprofile",
            name="must_change_password",
            field=models.BooleanField(default=False),
        ),
    ]
