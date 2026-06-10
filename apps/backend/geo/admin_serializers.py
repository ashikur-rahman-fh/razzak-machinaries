from rest_framework import serializers

from api.serializers.bilingual import validate_bilingual_pair
from geo.exceptions import GeoIdConflict
from geo.models import District, Division, Union, Upazila
from geo.services import next_geo_id


class BilingualGeoWriteMixin:
    def validate_name_fields(self, attrs: dict, *, partial: bool) -> dict:
        instance = getattr(self, "instance", None)
        name_en = attrs.get("name_en", instance.name_en if instance else None)
        name_bn = attrs.get("name_bn", instance.name_bn if instance else None)

        if not partial or "name_en" in attrs or "name_bn" in attrs:
            validate_bilingual_pair(name_en, name_bn, field_label="Name")
        return attrs

    def assign_id_on_create(self, attrs: dict, model) -> dict:
        if attrs.get("id") is not None:
            if model.objects.filter(pk=attrs["id"]).exists():
                raise GeoIdConflict()
            return attrs

        attrs["id"] = next_geo_id(model)
        return attrs


class DivisionAdminSerializer(BilingualGeoWriteMixin, serializers.ModelSerializer):
    nameEn = serializers.CharField(source="name_en", required=False, allow_blank=True)
    nameBn = serializers.CharField(source="name_bn", required=False, allow_blank=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Division
        fields = ["id", "nameEn", "nameBn"]

    def validate(self, attrs):
        attrs = self.validate_name_fields(attrs, partial=self.partial)
        if not self.instance:
            attrs = self.assign_id_on_create(attrs, Division)
        return attrs


class DistrictAdminSerializer(BilingualGeoWriteMixin, serializers.ModelSerializer):
    nameEn = serializers.CharField(source="name_en", required=False, allow_blank=True)
    nameBn = serializers.CharField(source="name_bn", required=False, allow_blank=True)
    divisionId = serializers.PrimaryKeyRelatedField(
        source="division",
        queryset=Division.objects.all(),
        required=False,
    )
    id = serializers.IntegerField(required=False)

    class Meta:
        model = District
        fields = ["id", "nameEn", "nameBn", "divisionId"]

    def validate(self, attrs):
        attrs = self.validate_name_fields(attrs, partial=self.partial)
        if not self.instance:
            if "division" not in attrs:
                raise serializers.ValidationError({"divisionId": "This field is required."})
            attrs = self.assign_id_on_create(attrs, District)
        return attrs


class UpazilaAdminSerializer(BilingualGeoWriteMixin, serializers.ModelSerializer):
    nameEn = serializers.CharField(source="name_en", required=False, allow_blank=True)
    nameBn = serializers.CharField(source="name_bn", required=False, allow_blank=True)
    districtId = serializers.PrimaryKeyRelatedField(
        source="district",
        queryset=District.objects.all(),
        required=False,
    )
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Upazila
        fields = ["id", "nameEn", "nameBn", "districtId"]

    def validate(self, attrs):
        attrs = self.validate_name_fields(attrs, partial=self.partial)
        if not self.instance:
            if "district" not in attrs:
                raise serializers.ValidationError({"districtId": "This field is required."})
            attrs = self.assign_id_on_create(attrs, Upazila)
        return attrs


class UnionAdminSerializer(BilingualGeoWriteMixin, serializers.ModelSerializer):
    nameEn = serializers.CharField(source="name_en", required=False, allow_blank=True)
    nameBn = serializers.CharField(source="name_bn", required=False, allow_blank=True)
    upazilaId = serializers.PrimaryKeyRelatedField(
        source="upazila",
        queryset=Upazila.objects.all(),
        required=False,
    )
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Union
        fields = ["id", "nameEn", "nameBn", "upazilaId"]

    def validate(self, attrs):
        attrs = self.validate_name_fields(attrs, partial=self.partial)
        if not self.instance:
            if "upazila" not in attrs:
                raise serializers.ValidationError({"upazilaId": "This field is required."})
            attrs = self.assign_id_on_create(attrs, Union)
        return attrs
