from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request

from api.services.translation.base import TranslationResult
from api.services.translation.exceptions import TranslationFailed

logger = logging.getLogger(__name__)

PROVIDER_NAME = "libretranslate"
DEFAULT_TIMEOUT_SECONDS = 10


class LibreTranslateProvider:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout_seconds: int | None = None,
    ) -> None:
        self.base_url = (base_url or os.environ.get("LIBRETRANSLATE_URL", "")).rstrip("/")
        self.api_key = (
            api_key if api_key is not None else os.environ.get("LIBRETRANSLATE_API_KEY", "")
        )
        self.timeout_seconds = timeout_seconds or int(
            os.environ.get("TRANSLATION_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))
        )

    def translate(self, text: str, source: str, target: str) -> TranslationResult:
        if not self.base_url:
            raise TranslationFailed()

        payload: dict[str, str] = {
            "q": text,
            "source": source,
            "target": target,
            "format": "text",
        }
        if self.api_key:
            payload["api_key"] = self.api_key

        request = urllib.request.Request(
            f"{self.base_url}/translate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            logger.warning("Translation provider HTTP error: status=%s", exc.code)
            raise TranslationFailed() from exc
        except urllib.error.URLError as exc:
            logger.warning("Translation provider connection error: %s", exc.reason)
            raise TranslationFailed() from exc
        except TimeoutError as exc:
            logger.warning("Translation provider timed out")
            raise TranslationFailed() from exc
        except json.JSONDecodeError as exc:
            logger.warning("Translation provider returned invalid JSON")
            raise TranslationFailed() from exc

        translated = body.get("translatedText")
        if not isinstance(translated, str) or not translated.strip():
            logger.warning("Translation provider returned empty result")
            raise TranslationFailed()

        return TranslationResult(translated_text=translated.strip(), provider=PROVIDER_NAME)
