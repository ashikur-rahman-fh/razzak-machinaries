from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _extract_phpmyadmin_table_rows(
    payload: list[Any],
    *,
    table_name: str | None = None,
    source_label: str = "import",
) -> list[dict[str, Any]]:
    for item in payload:
        if not isinstance(item, dict) or item.get("type") != "table":
            continue
        if table_name is not None and item.get("name") != table_name:
            continue
        rows = item.get("data")
        if not isinstance(rows, list):
            raise ValueError(f"Table data missing in {source_label}")
        return rows

    if table_name is not None:
        raise ValueError(f'No table export named "{table_name}" found in {source_label}')
    raise ValueError(f"No table export found in {source_label}")


def _is_plain_village_row_array(payload: list[Any]) -> bool:
    if not payload:
        return False
    first = payload[0]
    if not isinstance(first, dict):
        return False
    if first.get("type") in {"header", "database", "table"}:
        return False
    return "id" in first and ("name" in first or "bn_name" in first)


def parse_phpmyadmin_table(path: Path, *, table_name: str | None = None) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError(f"Expected a JSON array in {path}")

    return _extract_phpmyadmin_table_rows(payload, table_name=table_name, source_label=str(path))


def parse_village_import_payload(
    raw: bytes | str,
    *,
    table_name: str = "villages",
) -> list[dict[str, Any]]:
    text = raw.decode("utf-8") if isinstance(raw, bytes) else raw

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON file.") from exc

    if isinstance(payload, list):
        if _is_plain_village_row_array(payload):
            return payload
        return _extract_phpmyadmin_table_rows(
            payload,
            table_name=table_name,
            source_label="uploaded file",
        )

    raise ValueError("Expected a JSON array (plain village rows or PHPMyAdmin export).")


def parse_int(value: Any, *, field: str, source: Path | str = "import") -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid integer for {field} in {source}: {value!r}") from exc


def parse_bilingual_row(row: dict[str, Any], *, source: Path | str = "import") -> dict[str, str]:
    name_en = row.get("name")
    name_bn = row.get("bn_name")
    if not isinstance(name_en, str) or not name_en.strip():
        raise ValueError(f"Missing name in {source}: {row!r}")
    if not isinstance(name_bn, str) or not name_bn.strip():
        raise ValueError(f"Missing bn_name in {source}: {row!r}")
    return {"name_en": name_en.strip(), "name_bn": name_bn.strip()}
