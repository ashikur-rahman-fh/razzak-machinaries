from django.conf import settings
from django.db import models


class HalkhataStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"


class Halkhata(models.Model):
    title = models.CharField(max_length=255)
    date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=16,
        choices=HalkhataStatus.choices,
        default=HalkhataStatus.ACTIVE,
        db_index=True,
    )
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_halkhatas",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name_plural = "halkhatas"

    def __str__(self) -> str:
        return f"{self.title} ({self.date})"
