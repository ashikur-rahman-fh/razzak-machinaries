from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from geo.admin_serializers import (
    DistrictAdminSerializer,
    DivisionAdminSerializer,
    UnionAdminSerializer,
    UpazilaAdminSerializer,
    VillageAdminSerializer,
)
from geo.cache import bump_geo_cache_version
from geo.exceptions import GeoHasChildren
from geo.filters import apply_geo_ordering, apply_geo_search, apply_parent_filter
from geo.import_services import commit_village_import, preview_village_import
from geo.models import District, Division, Union, Upazila, Village
from geo.pagination import GeoPageNumberPagination


class GeoApiThrottle(ScopedRateThrottle):
    scope = "api"


CHILD_TYPE_BY_MODEL = {
    Division: "district",
    District: "upazila",
    Upazila: "union",
}


class AdminGeoViewSet(viewsets.ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    pagination_class = GeoPageNumberPagination
    throttle_classes = [GeoApiThrottle]

    parent_query_param: str | None = None
    parent_filter_field: str | None = None

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = apply_geo_search(queryset, self.request.query_params.get("search"))

        if self.parent_query_param and self.parent_filter_field:
            queryset = apply_parent_filter(
                queryset,
                param_value=self.request.query_params.get(self.parent_query_param),
                param_name=self.parent_query_param,
                filter_field=self.parent_filter_field,
            )

        return apply_geo_ordering(queryset, self.request.query_params.get("ordering"))

    def perform_create(self, serializer):
        serializer.save()
        bump_geo_cache_version()

    def perform_update(self, serializer):
        serializer.save()
        bump_geo_cache_version()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            child_type = CHILD_TYPE_BY_MODEL.get(type(instance), "child")
            raise GeoHasChildren(child_type=child_type) from None

        bump_geo_cache_version()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DivisionAdminViewSet(AdminGeoViewSet):
    queryset = Division.objects.all()
    serializer_class = DivisionAdminSerializer


class DistrictAdminViewSet(AdminGeoViewSet):
    queryset = District.objects.select_related("division")
    serializer_class = DistrictAdminSerializer
    parent_query_param = "divisionId"
    parent_filter_field = "division_id"


class UpazilaAdminViewSet(AdminGeoViewSet):
    queryset = Upazila.objects.select_related("district")
    serializer_class = UpazilaAdminSerializer
    parent_query_param = "districtId"
    parent_filter_field = "district_id"


class UnionAdminViewSet(AdminGeoViewSet):
    queryset = Union.objects.select_related("upazila")
    serializer_class = UnionAdminSerializer
    parent_query_param = "upazilaId"
    parent_filter_field = "upazila_id"


class VillageAdminViewSet(AdminGeoViewSet):
    queryset = Village.objects.all()
    serializer_class = VillageAdminSerializer


def _parse_dry_run_flag(value: str | None) -> bool:
    if value is None:
        return False
    return value.lower() in {"1", "true", "yes"}


class VillageImportView(APIView):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    throttle_classes = [GeoApiThrottle]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if upload is None:
            raise ValidationError({"file": "This field is required."})

        dry_run = _parse_dry_run_flag(request.query_params.get("dryRun"))

        try:
            raw = upload.read()
            summary = preview_village_import(raw) if dry_run else commit_village_import(raw)
        except ValueError as exc:
            raise ValidationError({"file": str(exc)}) from exc

        return Response(summary.to_response())
