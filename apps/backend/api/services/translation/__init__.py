from __future__ import annotations

import os

from api.services.translation.base import TranslationResult
from api.services.translation.cache import get_cached_translation, set_cached_translation
from api.services.translation.providers.azure import (
    PROVIDER_NAME as AZURE_PROVIDER_NAME,
)
from api.services.translation.providers.azure import (
    AzureTranslatorProvider,
)
from api.services.translation.providers.libretranslate import (
    PROVIDER_NAME as LIBRETRANSLATE_PROVIDER_NAME,
)
from api.services.translation.providers.libretranslate import (
    LibreTranslateProvider,
)

DEFAULT_CACHE_TTL_SECONDS = 86400
DEFAULT_PROVIDER = "azure"


def get_active_provider_name() -> str:
    provider = os.environ.get("TRANSLATION_PROVIDER", DEFAULT_PROVIDER).lower()
    if provider == "azure":
        return AZURE_PROVIDER_NAME
    if provider == "libretranslate":
        return LIBRETRANSLATE_PROVIDER_NAME
    return AZURE_PROVIDER_NAME


def get_translation_service():
    provider = os.environ.get("TRANSLATION_PROVIDER", DEFAULT_PROVIDER).lower()
    if provider == "azure":
        return AzureTranslatorProvider()
    if provider == "libretranslate":
        return LibreTranslateProvider()
    return AzureTranslatorProvider()


def translate(text: str, source: str, target: str) -> TranslationResult:
    provider_name = get_active_provider_name()
    cached = get_cached_translation(text, source, target)
    if cached is not None:
        return TranslationResult(translated_text=cached, provider=provider_name)

    provider = get_translation_service()
    result = provider.translate(text, source, target)

    ttl = int(os.environ.get("TRANSLATION_CACHE_TTL_SECONDS", str(DEFAULT_CACHE_TTL_SECONDS)))
    set_cached_translation(text, source, target, result.translated_text, ttl_seconds=ttl)
    return result
