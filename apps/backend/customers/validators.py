from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

PROFILE_PICTURE_MAX_BYTES = 2 * 1024 * 1024
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

BD_MOBILE_DIGITS_PATTERN = re.compile(r"^1[3-9]\d{8}$")
BANGLA_DIGIT_TRANSLATION = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
MEMO_BN_INPUT_PATTERN = re.compile(r"^[\u09E6-\u09EF0-9\s]+$")
DIGITS_ONLY_PATTERN = re.compile(r"^\d+$")


def bangla_to_latin_digits(value: str) -> str:
    return value.translate(BANGLA_DIGIT_TRANSLATION)


def normalize_bangladesh_phone(raw: str) -> str:
    cleaned = bangla_to_latin_digits(raw.strip()).replace(" ", "").replace("-", "")
    if cleaned.startswith("+880"):
        digits = cleaned[4:]
    elif cleaned.startswith("880"):
        digits = cleaned[3:]
    elif cleaned.startswith("0"):
        digits = cleaned[1:]
    else:
        digits = cleaned

    if not BD_MOBILE_DIGITS_PATTERN.match(digits):
        raise ValidationError("Enter a valid Bangladeshi mobile number.")

    return f"+880{digits}"


def normalize_phone_en(raw: str) -> str:
    cleaned = bangla_to_latin_digits(raw.strip()).replace(" ", "").replace("-", "")
    if cleaned.startswith("+880"):
        digits = cleaned[4:]
        return f"0{digits}" if digits else cleaned
    if cleaned.startswith("880"):
        return f"0{cleaned[3:]}"
    return cleaned


def validate_digits_only(value: str | None, *, field_label: str) -> str:
    normalized = bangla_to_latin_digits((value or "").strip()).replace(" ", "")
    if not normalized or not DIGITS_ONLY_PATTERN.match(normalized):
        raise ValidationError(f"{field_label} must contain digits only.")
    return normalized


def validate_memo_page_number_bn(value: str | None) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise ValidationError("Memo page number (Bangla) is required.")
    if not MEMO_BN_INPUT_PATTERN.match(normalized):
        raise ValidationError("Memo page number (Bangla) must contain digits only.")
    return normalized


def validate_profile_picture(upload) -> None:
    if upload.size > PROFILE_PICTURE_MAX_BYTES:
        raise ValidationError("Profile picture must be 2 MB or smaller.")

    content_type = getattr(upload, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValidationError("Profile picture must be JPG, PNG, or WebP.")

    try:
        upload.seek(0)
        with Image.open(upload) as image:
            image.verify()
        upload.seek(0)
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("Profile picture is not a valid image file.") from exc


def validate_required_text(value: str | None, *, field_label: str) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise ValidationError(f"{field_label} is required.")
    return normalized
