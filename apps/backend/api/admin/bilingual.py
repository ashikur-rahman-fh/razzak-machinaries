from django.contrib import admin


class BilingualModelAdmin(admin.ModelAdmin):
    """Base admin with English/Bangla fieldsets for bilingual content models."""

    def bilingual_fieldsets(self, field_bases: list[str]) -> tuple[tuple[str, dict], ...]:
        english_fields: list[str] = []
        bangla_fields: list[str] = []

        for base in field_bases:
            english_fields.append(f"{base}_en")
            bangla_fields.append(f"{base}_bn")

        return (
            ("English Content", {"fields": tuple(english_fields)}),
            ("Bangla Content", {"fields": tuple(bangla_fields)}),
        )

    def bilingual_search_fields(self, field_bases: list[str]) -> tuple[str, ...]:
        fields: list[str] = []
        for base in field_bases:
            fields.extend([f"{base}_en", f"{base}_bn"])
        return tuple(fields)
