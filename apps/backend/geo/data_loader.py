from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def parse_phpmyadmin_table(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"Expected a JSON array in {path}")

    for item in payload:
        if isinstance(item, dict) and item.get("type") == "table":
            rows = item.get("data")
            if not isinstance(rows, list):
                raise ValueError(f"Table data missing in {path}")
            return rows

    raise ValueError(f"No table export found in {path}")


def parse_int(value: Any, *, field: str, source: Path) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid integer for {field} in {source}: {value!r}") from exc


def parse_bilingual_row(row: dict[str, Any], *, source: Path) -> dict[str, str]:
    name_en = row.get("name")
    name_bn = row.get("bn_name")
    if not isinstance(name_en, str) or not name_en.strip():
        raise ValueError(f"Missing name in {source}: {row!r}")
    if not isinstance(name_bn, str) or not name_bn.strip():
        raise ValueError(f"Missing bn_name in {source}: {row!r}")
    return {"name_en": name_en.strip(), "name_bn": name_bn.strip()}
