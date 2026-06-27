from __future__ import annotations

import secrets
import string

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

_PASSWORD_WORDS = (
    "Kolom",
    "Machin",
    "Razzak",
    "Secure",
    "Strong",
    "Access",
    "Portal",
    "Admin",
    "Staff",
    "Login",
)
_PASSWORD_SPECIALS = "!@#$%^&*-_=+"
_MAX_GENERATION_ATTEMPTS = 50
_LEGACY_ALPHABET = (
    string.ascii_letters.replace("O", "").replace("l", "")
    + string.digits.replace("0", "").replace("1", "")
    + _PASSWORD_SPECIALS
)
_LEGACY_PASSWORD_LENGTH = 20


def generate_readable_temporary_password(*, user: User | None = None) -> str:
    """Generate a readable but secure temporary password, e.g. Razzak-8392-Kolom!"""
    for _ in range(_MAX_GENERATION_ATTEMPTS):
        prefix = secrets.choice(_PASSWORD_WORDS)
        digits = "".join(secrets.choice(string.digits) for _ in range(4))
        suffix = secrets.choice(_PASSWORD_WORDS)
        special = secrets.choice(_PASSWORD_SPECIALS)
        candidate = f"{prefix}-{digits}-{suffix}{special}"
        if _is_valid_password(candidate, user=user):
            return candidate
    raise RuntimeError("Could not generate a password that passes validation.")


def generate_legacy_temporary_password(*, user: User | None = None) -> str:
    """Generate a random temporary password (CLI compatibility)."""
    for _ in range(_MAX_GENERATION_ATTEMPTS):
        candidate = "".join(
            secrets.choice(_LEGACY_ALPHABET) for _ in range(_LEGACY_PASSWORD_LENGTH)
        )
        if _is_valid_password(candidate, user=user):
            return candidate
    raise RuntimeError("Could not generate a password that passes validation.")


def _is_valid_password(candidate: str, *, user: User | None) -> bool:
    try:
        validate_password(candidate, user=user)
    except ValidationError:
        return False
    return True
