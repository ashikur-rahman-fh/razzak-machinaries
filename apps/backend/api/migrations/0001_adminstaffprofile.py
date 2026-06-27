from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_staff_profiles(apps, schema_editor):
    User = apps.get_model("auth", "User")
    AdminStaffProfile = apps.get_model("api", "AdminStaffProfile")
    for user in User.objects.filter(models.Q(is_staff=True) | models.Q(is_superuser=True)):
        AdminStaffProfile.objects.get_or_create(
            user=user,
            defaults={
                "phone": "",
                "must_change_password": False,
            },
        )


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminStaffProfile",
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
                ("phone", models.CharField(blank=True, default="", max_length=32)),
                ("must_change_password", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "admin staff profile",
                "verbose_name_plural": "admin staff profiles",
            },
        ),
        migrations.RunPython(backfill_staff_profiles, migrations.RunPython.noop),
    ]
