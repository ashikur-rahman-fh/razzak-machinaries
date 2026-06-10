import json

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient

from geo.models import District, Division, Union, Upazila

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def sample_geo_data_dir(tmp_path):
    divisions = [
        {
            "type": "table",
            "name": "divisions",
            "data": [
                {"id": "1", "name": "Chattagram", "bn_name": "চট্টগ্রাম", "url": "example.com"},
                {"id": "2", "name": "Dhaka", "bn_name": "ঢাকা", "url": "example.com"},
            ],
        }
    ]
    districts = [
        {
            "type": "table",
            "name": "districts",
            "data": [
                {
                    "id": "1",
                    "division_id": "1",
                    "name": "Comilla",
                    "bn_name": "কুমিল্লা",
                    "lat": "0",
                    "lon": "0",
                    "url": "example.com",
                },
                {
                    "id": "2",
                    "division_id": "2",
                    "name": "Dhaka",
                    "bn_name": "ঢাকা",
                    "lat": "0",
                    "lon": "0",
                    "url": "example.com",
                },
            ],
        }
    ]
    upazilas = [
        {
            "type": "table",
            "name": "upazilas",
            "data": [
                {
                    "id": "1",
                    "district_id": "1",
                    "name": "Debidwar",
                    "bn_name": "দেবিদ্বার",
                    "url": "example.com",
                }
            ],
        }
    ]
    unions = [
        {
            "type": "table",
            "name": "unions",
            "data": [
                {
                    "id": "1",
                    "upazilla_id": "1",
                    "name": "Subil",
                    "bn_name": "সুবিল",
                    "url": "example.com",
                }
            ],
        }
    ]

    (tmp_path / "divisions.json").write_text(json.dumps(divisions), encoding="utf-8")
    (tmp_path / "districts.json").write_text(json.dumps(districts), encoding="utf-8")
    (tmp_path / "upazilas.json").write_text(json.dumps(upazilas), encoding="utf-8")
    (tmp_path / "unions.json").write_text(json.dumps(unions), encoding="utf-8")
    return tmp_path


def test_load_bd_geo_code_is_idempotent(sample_geo_data_dir):
    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)
    assert Division.objects.count() == 2
    assert District.objects.count() == 2
    assert Upazila.objects.count() == 1
    assert Union.objects.count() == 1

    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir))
    assert Division.objects.count() == 2
    assert District.objects.count() == 2


def test_load_bd_geo_code_fails_on_missing_parent(sample_geo_data_dir):
    districts_path = sample_geo_data_dir / "districts.json"
    payload = json.loads(districts_path.read_text(encoding="utf-8"))
    payload[0]["data"][0]["division_id"] = "999"
    districts_path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(CommandError, match="missing division_id=999"):
        call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)


def test_public_geo_divisions_empty(client):
    response = client.get("/api/public/geo/divisions/")
    assert response.status_code == 200
    assert response.json() == []


def test_public_geo_divisions_after_seed(client, sample_geo_data_dir):
    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)

    response = client.get("/api/public/geo/divisions/")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0] == {
        "id": 1,
        "nameEn": "Chattagram",
        "nameBn": "চট্টগ্রাম",
    }


def test_public_geo_districts_requires_division_id(client):
    response = client.get("/api/public/geo/districts/")
    assert response.status_code == 400
    assert response.json()["success"] is False
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_public_geo_districts_filtered(client, sample_geo_data_dir):
    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)

    response = client.get("/api/public/geo/districts/?divisionId=1")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["nameEn"] == "Comilla"

    empty = client.get("/api/public/geo/districts/?divisionId=999")
    assert empty.status_code == 400


def test_public_geo_upazilas_filtered(client, sample_geo_data_dir):
    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)

    response = client.get("/api/public/geo/upazilas/?districtId=1")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_public_geo_unions_filtered(client, sample_geo_data_dir):
    call_command("load_bd_geo_code", data_dir=str(sample_geo_data_dir), clear=True)

    response = client.get("/api/public/geo/unions/?upazilaId=1")
    assert response.status_code == 200
    assert response.json()[0]["nameEn"] == "Subil"
