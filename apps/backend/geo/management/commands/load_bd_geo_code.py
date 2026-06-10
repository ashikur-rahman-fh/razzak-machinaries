from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from geo.data_loader import parse_bilingual_row, parse_int, parse_phpmyadmin_table
from geo.models import District, Division, Union, Upazila


class Command(BaseCommand):
    help = "Load Bangladesh geo reference data from PHPMyAdmin JSON exports."

    def add_arguments(self, parser):
        parser.add_argument(
            "--data-dir",
            default=None,
            help="Directory containing divisions.json, districts.json, upazilas.json, unions.json",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all geo rows before loading (dev/troubleshooting only).",
        )

    def handle(self, *args, **options):
        from pathlib import Path

        default_dir = Path(__file__).resolve().parent.parent.parent / "data"
        data_dir = Path(options["data_dir"]) if options["data_dir"] else default_dir
        if not data_dir.is_dir():
            raise CommandError(f"Data directory not found: {data_dir}")

        files = {
            "divisions": data_dir / "divisions.json",
            "districts": data_dir / "districts.json",
            "upazilas": data_dir / "upazilas.json",
            "unions": data_dir / "unions.json",
        }
        for label, path in files.items():
            if not path.is_file():
                raise CommandError(f"Missing {label} file: {path}")

        with transaction.atomic():
            if options["clear"]:
                self._clear_geo_tables()

            division_stats = self._load_divisions(files["divisions"])
            district_stats = self._load_districts(files["districts"])
            upazila_stats = self._load_upazilas(files["upazilas"])
            union_stats = self._load_unions(files["unions"])

        self.stdout.write(
            self.style.SUCCESS(
                "Geo sync complete. "
                f"divisions={division_stats} districts={district_stats} "
                f"upazilas={upazila_stats} unions={union_stats}"
            )
        )

    def _clear_geo_tables(self):
        Union.objects.all().delete()
        Upazila.objects.all().delete()
        District.objects.all().delete()
        Division.objects.all().delete()
        self.stdout.write("Cleared all geo tables.")

    def _load_divisions(self, path):
        rows = parse_phpmyadmin_table(path)
        created = updated = 0
        for row in rows:
            row_id = parse_int(row.get("id"), field="id", source=path)
            names = parse_bilingual_row(row, source=path)
            _, was_created = Division.objects.update_or_create(
                id=row_id,
                defaults=names,
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return {"created": created, "updated": updated, "total": len(rows)}

    def _load_districts(self, path):
        rows = parse_phpmyadmin_table(path)
        created = updated = 0
        for row in rows:
            row_id = parse_int(row.get("id"), field="id", source=path)
            division_id = parse_int(row.get("division_id"), field="division_id", source=path)
            if not Division.objects.filter(pk=division_id).exists():
                raise CommandError(
                    f"District {row_id} references missing division_id={division_id} in {path.name}"
                )
            names = parse_bilingual_row(row, source=path)
            _, was_created = District.objects.update_or_create(
                id=row_id,
                defaults={**names, "division_id": division_id},
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return {"created": created, "updated": updated, "total": len(rows)}

    def _load_upazilas(self, path):
        rows = parse_phpmyadmin_table(path)
        created = updated = 0
        for row in rows:
            row_id = parse_int(row.get("id"), field="id", source=path)
            district_id = parse_int(row.get("district_id"), field="district_id", source=path)
            if not District.objects.filter(pk=district_id).exists():
                raise CommandError(
                    f"Upazila {row_id} references missing district_id={district_id} in {path.name}"
                )
            names = parse_bilingual_row(row, source=path)
            _, was_created = Upazila.objects.update_or_create(
                id=row_id,
                defaults={**names, "district_id": district_id},
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return {"created": created, "updated": updated, "total": len(rows)}

    def _load_unions(self, path):
        rows = parse_phpmyadmin_table(path)
        created = updated = 0
        for row in rows:
            row_id = parse_int(row.get("id"), field="id", source=path)
            upazila_id = parse_int(row.get("upazilla_id"), field="upazilla_id", source=path)
            if not Upazila.objects.filter(pk=upazila_id).exists():
                raise CommandError(
                    f"Union {row_id} references missing upazila_id={upazila_id} in {path.name}"
                )
            names = parse_bilingual_row(row, source=path)
            _, was_created = Union.objects.update_or_create(
                id=row_id,
                defaults={**names, "upazila_id": upazila_id},
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return {"created": created, "updated": updated, "total": len(rows)}
