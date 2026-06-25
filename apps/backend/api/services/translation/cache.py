from __future__ import annotations

import hashlib

from django.core.cache import cache


def build_translation_cache_key(text: str, source: str, target: str) -> str:
    digest = hashlib.sha256(f"{source}:{target}:{text}".encode()).hexdigest()
    return f"translation:{digest}"


def get_cached_translation(text: str, source: str, target: str) -> str | None:
    return cache.get(build_translation_cache_key(text, source, target))


def set_cached_translation(
    text: str,
    source: str,
    target: str,
    translated_text: str,
    *,
    ttl_seconds: int,
) -> None:
    cache.set(
        build_translation_cache_key(text, source, target),
        translated_text,
        timeout=ttl_seconds,
    )
