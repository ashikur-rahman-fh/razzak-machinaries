from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class TranslationResult:
    translated_text: str
    provider: str


class TranslationProvider(Protocol):
    def translate(self, text: str, source: str, target: str) -> TranslationResult: ...
