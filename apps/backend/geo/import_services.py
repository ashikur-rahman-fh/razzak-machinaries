from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from django.db import transaction

from geo.cache import bump_geo_cache_version
from geo.data_loader import parse_bilingual_row, parse_int, parse_village_import_payload
from geo.models import Village

MAX_IMPORT_ERRORS = 50


@dataclass
class VillageImportRowError:
    row_index: int
    message: str


@dataclass
class VillageImportSummary:
    total: int
    valid: int
    invalid: int
    would_create: int
    would_update: int
    errors: list[VillageImportRowError] = field(default_factory=list)

    def to_response(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "valid": self.valid,
            "invalid": self.invalid,
            "wouldCreate": self.would_create,
            "wouldUpdate": self.would_update,
            "errors": [{"rowIndex": e.row_index, "message": e.message} for e in self.errors],
        }


def _normalize_village_rows(
    raw_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[VillageImportRowError]]:
    normalized: list[dict[str, Any]] = []
    errors: list[VillageImportRowError] = []
    seen_ids: set[int] = set()

    for index, row in enumerate(raw_rows, start=1):
        if not isinstance(row, dict):
            errors.append(
                VillageImportRowError(row_index=index, message="Row must be a JSON object.")
            )
            continue

        try:
            row_id = parse_int(row.get("id"), field="id", source=f"row {index}")
            names = parse_bilingual_row(row, source=f"row {index}")
        except ValueError as exc:
            errors.append(VillageImportRowError(row_index=index, message=str(exc)))
            continue

        if row_id in seen_ids:
            errors.append(
                VillageImportRowError(
                    row_index=index, message=f"Duplicate id {row_id} in import file."
                )
            )
            continue

        seen_ids.add(row_id)
        normalized.append({"id": row_id, **names})

    return normalized, errors


def _build_summary(
    raw_rows: list[dict[str, Any]],
    normalized: list[dict[str, Any]],
    row_errors: list[VillageImportRowError],
) -> VillageImportSummary:
    existing_ids = set(
        Village.objects.filter(pk__in=[r["id"] for r in normalized]).values_list("pk", flat=True)
    )
    would_create = sum(1 for r in normalized if r["id"] not in existing_ids)
    would_update = len(normalized) - would_create

    return VillageImportSummary(
        total=len(raw_rows),
        valid=len(normalized),
        invalid=len(row_errors),
        would_create=would_create,
        would_update=would_update,
        errors=row_errors[:MAX_IMPORT_ERRORS],
    )


def parse_and_validate_village_import(
    raw: bytes | str,
) -> tuple[list[dict[str, Any]], VillageImportSummary]:
    raw_rows = parse_village_import_payload(raw)
    if not raw_rows:
        raise ValueError("Import file contains no village rows.")

    normalized, row_errors = _normalize_village_rows(raw_rows)
    summary = _build_summary(raw_rows, normalized, row_errors)
    return normalized, summary


def preview_village_import(raw: bytes | str) -> VillageImportSummary:
    _, summary = parse_and_validate_village_import(raw)
    return summary


def commit_village_import(raw: bytes | str) -> VillageImportSummary:
    normalized, summary = parse_and_validate_village_import(raw)

    if summary.invalid > 0:
        return summary

    with transaction.atomic():
        for row in normalized:
            Village.objects.update_or_create(
                id=row["id"],
                defaults={"name_en": row["name_en"], "name_bn": row["name_bn"]},
            )
        bump_geo_cache_version()

    return summary
