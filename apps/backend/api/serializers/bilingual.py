from __future__ import annotations

from collections.abc import Iterable

from rest_framework.exceptions import ValidationError


def bilingual_field_names(base_name: str) -> tuple[str, str]:
    return (f"{base_name}_en", f"{base_name}_bn")


def bilingual_camel_case_names(base_name: str) -> tuple[str, str]:
    return (f"{base_name}En", f"{base_name}Bn")


def to_camel_case_bilingual_payload(
    instance,
    field_bases: Iterable[str],
) -> dict[str, str | None]:
    payload: dict[str, str | None] = {}
    for base in field_bases:
        en_field, bn_field = bilingual_field_names(base)
        en_key, bn_key = bilingual_camel_case_names(base)
        payload[en_key] = getattr(instance, en_field, None)
        payload[bn_key] = getattr(instance, bn_field, None)
    return payload


def validate_bilingual_pair(
    english: str | None,
    bangla: str | None,
    *,
    field_label: str,
) -> None:
    if not (english and english.strip()) and not (bangla and bangla.strip()):
        raise ValidationError(f"{field_label} must be provided in at least one language.")
