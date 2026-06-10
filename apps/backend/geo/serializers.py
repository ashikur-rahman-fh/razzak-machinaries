from rest_framework import serializers


class GeoNameSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    nameEn = serializers.CharField(source="name_en", read_only=True)
    nameBn = serializers.CharField(source="name_bn", read_only=True)

    @classmethod
    def serialize_many(cls, queryset):
        return cls(queryset, many=True).data


def serialize_geo_queryset(queryset) -> list[dict]:
    return GeoNameSerializer(queryset, many=True).data


def validate_parent_id(value: str | None, *, param_name: str) -> int:
    if value is None or value == "":
        raise serializers.ValidationError({param_name: "This query parameter is required."})
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise serializers.ValidationError({param_name: "Must be a valid integer."}) from exc
    if parsed <= 0:
        raise serializers.ValidationError({param_name: "Must be a positive integer."})
    return parsed
