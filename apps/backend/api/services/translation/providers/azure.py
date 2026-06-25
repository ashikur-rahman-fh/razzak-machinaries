from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request

from api.services.translation.base import TranslationResult
from api.services.translation.exceptions import TranslationFailed

logger = logging.getLogger(__name__)

PROVIDER_NAME = "azure"
DEFAULT_TIMEOUT_SECONDS = 10
API_VERSION = "3.0"


def build_azure_translate_url(endpoint: str, source: str, target: str) -> str:
    base = endpoint.rstrip("/")
    query = urllib.parse.urlencode(
        {
            "api-version": API_VERSION,
            "from": source,
            "to": target,
        }
    )
    return f"{base}/translator/text/v3.0/translate?{query}"


class AzureTranslatorProvider:
    provider_name = PROVIDER_NAME

    def __init__(
        self,
        *,
        endpoint: str | None = None,
        api_key: str | None = None,
        region: str | None = None,
        timeout_seconds: int | None = None,
    ) -> None:
        self.endpoint = (endpoint or os.environ.get("AZURE_TRANSLATOR_ENDPOINT", "")).rstrip("/")
        self.api_key = (
            api_key if api_key is not None else os.environ.get("AZURE_TRANSLATOR_KEY", "")
        )
        self.region = (
            region if region is not None else os.environ.get("AZURE_TRANSLATOR_REGION", "")
        )
        self.timeout_seconds = timeout_seconds or int(
            os.environ.get("TRANSLATION_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))
        )

    def translate(self, text: str, source: str, target: str) -> TranslationResult:
        if not self.endpoint or not self.api_key:
            raise TranslationFailed()

        url = build_azure_translate_url(self.endpoint, source, target)
        payload = json.dumps([{"Text": text}]).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.api_key,
        }
        if self.region:
            headers["Ocp-Apim-Subscription-Region"] = self.region

        request = urllib.request.Request(url, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            logger.warning("Azure Translator HTTP error: status=%s", exc.code)
            raise TranslationFailed() from exc
        except urllib.error.URLError as exc:
            logger.warning("Azure Translator connection error: %s", exc.reason)
            raise TranslationFailed() from exc
        except TimeoutError as exc:
            logger.warning("Azure Translator timed out")
            raise TranslationFailed() from exc
        except json.JSONDecodeError as exc:
            logger.warning("Azure Translator returned invalid JSON")
            raise TranslationFailed() from exc

        translated = _extract_translated_text(body)
        if not translated:
            logger.warning("Azure Translator returned empty result")
            raise TranslationFailed()

        return TranslationResult(translated_text=translated, provider=PROVIDER_NAME)


def _extract_translated_text(body: object) -> str | None:
    if not isinstance(body, list) or not body:
        return None

    first = body[0]
    if not isinstance(first, dict):
        return None

    translations = first.get("translations")
    if not isinstance(translations, list) or not translations:
        return None

    entry = translations[0]
    if not isinstance(entry, dict):
        return None

    text = entry.get("text")
    if not isinstance(text, str):
        return None

    stripped = text.strip()
    return stripped or None
