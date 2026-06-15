import json
from pathlib import Path

import pytest

from geo.data_loader import parse_phpmyadmin_table, parse_village_import_payload
from geo.import_services import commit_village_import, preview_village_import


def _phpmyadmin_villages_payload(rows: list[dict]) -> str:
    return json.dumps(
        [
            {"type": "header", "version": "4.8.5"},
            {"type": "database", "name": "bd_geo_code"},
            {
                "type": "table",
                "name": "villages",
                "database": "bd_geo_code",
                "data": rows,
            },
        ]
    )


def test_parse_village_import_payload_phpmyadmin_format():
    raw = _phpmyadmin_villages_payload([{"id": "1", "name": "Balarampur", "bn_name": "বলরামপুর"}])
    rows = parse_village_import_payload(raw)
    assert len(rows) == 1
    assert rows[0]["name"] == "Balarampur"


def test_parse_village_import_payload_plain_array():
    raw = json.dumps([{"id": "2", "name": "Test Village", "bn_name": "টেস্ট"}])
    rows = parse_village_import_payload(raw)
    assert len(rows) == 1
    assert rows[0]["id"] == "2"


def test_parse_village_import_payload_table_wrapper_not_misdetected_as_plain_array():
    raw = json.dumps(
        [
            {
                "type": "table",
                "name": "villages",
                "data": [{"id": "1", "name": "Balarampur", "bn_name": "বলরামপুর"}],
            }
        ]
    )
    rows = parse_village_import_payload(raw)
    assert len(rows) == 1
    assert rows[0]["name"] == "Balarampur"


def test_parse_village_import_payload_missing_table():
    raw = json.dumps([{"type": "header"}, {"type": "table", "name": "districts", "data": []}])
    with pytest.raises(ValueError, match='No table export named "villages"'):
        parse_village_import_payload(raw)


def test_parse_village_import_payload_invalid_json():
    with pytest.raises(ValueError, match="Invalid JSON"):
        parse_village_import_payload("{not-json")


def test_parse_phpmyadmin_table_with_table_name(tmp_path: Path):
    path = tmp_path / "villages.json"
    path.write_text(
        _phpmyadmin_villages_payload([{"id": "1", "name": "A", "bn_name": "অ"}]),
        encoding="utf-8",
    )
    rows = parse_phpmyadmin_table(path, table_name="villages")
    assert len(rows) == 1


@pytest.mark.django_db
def test_preview_village_import_counts():
    raw = _phpmyadmin_villages_payload(
        [
            {"id": "1", "name": "Balarampur", "bn_name": "বলরামপুর"},
            {"id": "2", "name": "Boro Bihanali", "bn_name": "বড়বিহানালী"},
        ]
    )
    summary = preview_village_import(raw)
    assert summary.total == 2
    assert summary.valid == 2
    assert summary.invalid == 0
    assert summary.would_create == 2
    assert summary.would_update == 0


@pytest.mark.django_db
def test_preview_village_import_duplicate_ids_in_file():
    raw = _phpmyadmin_villages_payload(
        [
            {"id": "1", "name": "A", "bn_name": "অ"},
            {"id": "1", "name": "B", "bn_name": "ব"},
        ]
    )
    summary = preview_village_import(raw)
    assert summary.valid == 1
    assert summary.invalid == 1
    assert summary.errors[0].row_index == 2


@pytest.mark.django_db
def test_commit_village_import_creates_rows():
    raw = _phpmyadmin_villages_payload([{"id": "10", "name": "Balarampur", "bn_name": "বলরামপুর"}])
    summary = commit_village_import(raw)
    assert summary.invalid == 0
    assert summary.would_create == 1

    from geo.models import Village

    village = Village.objects.get(pk=10)
    assert village.name_en == "Balarampur"
    assert village.name_bn == "বলরামপুর"


@pytest.mark.django_db
def test_commit_village_import_updates_existing():
    from geo.models import Village

    Village.objects.create(id=10, name_en="Old", name_bn="পুরনো")
    raw = _phpmyadmin_villages_payload([{"id": "10", "name": "Balarampur", "bn_name": "বলরামপুর"}])
    summary = commit_village_import(raw)
    assert summary.would_update == 1
    village = Village.objects.get(pk=10)
    assert village.name_en == "Balarampur"
