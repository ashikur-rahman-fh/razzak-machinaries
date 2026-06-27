import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
        ("halkhata", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HalkhataInvitationGeneration",
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
                ("generated_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "customer_selection_mode",
                    models.CharField(
                        choices=[
                            ("manual", "Manual"),
                            ("all_active", "All active customers"),
                            ("due_only", "Customers with due only"),
                        ],
                        max_length=16,
                    ),
                ),
                ("customer_count", models.PositiveIntegerField()),
                ("selected_customer_ids", models.JSONField(default=list)),
                (
                    "status",
                    models.CharField(
                        choices=[("generated", "Generated")],
                        default="generated",
                        max_length=16,
                    ),
                ),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "generated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="halkhata_invitation_generations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "halkhata",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invitation_generations",
                        to="halkhata.halkhata",
                    ),
                ),
            ],
            options={
                "ordering": ["-generated_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="HalkhataInvitationRecipientSnapshot",
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
                ("customer_name_snapshot", models.CharField(max_length=255)),
                ("phone_snapshot", models.CharField(max_length=32)),
                ("address_snapshot", models.TextField()),
                ("father_name_snapshot", models.CharField(blank=True, default="", max_length=255)),
                ("due_amount_snapshot", models.DecimalField(decimal_places=2, max_digits=14)),
                (
                    "memo_page_number_snapshot",
                    models.CharField(blank=True, default="", max_length=32),
                ),
                ("sort_order", models.PositiveIntegerField()),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="halkhata_invitation_snapshots",
                        to="customers.customer",
                    ),
                ),
                (
                    "generation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipients",
                        to="halkhata.halkhatainvitationgeneration",
                    ),
                ),
            ],
            options={
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.AddIndex(
            model_name="halkhatainvitationgeneration",
            index=models.Index(
                fields=["halkhata", "-generated_at"],
                name="halkhata_hal_halkhat_0f0f0f_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="halkhatainvitationrecipientsnapshot",
            index=models.Index(
                fields=["generation", "sort_order"],
                name="halkhata_hal_generat_1a1a1a_idx",
            ),
        ),
    ]
