from __future__ import annotations

from pathlib import Path

from django.utils import timezone

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def customer_profile_upload_path(instance, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    customer_id = instance.pk or "new"
    return f"customers/profiles/{timezone.now():%Y/%m}/customer-{customer_id}{ext}"
