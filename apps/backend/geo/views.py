from django.core.cache import cache
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from geo.cache import GEO_CACHE_TTL_SECONDS, build_geo_cache_key
from geo.filters import apply_geo_ordering, apply_geo_search
from geo.models import District, Division, Union, Upazila, Village
from geo.pagination import GeoPageNumberPagination
from geo.serializers import GeoNameSerializer, serialize_geo_queryset, validate_parent_id


class GeoApiThrottle(ScopedRateThrottle):
    scope = "api"


def _cached_geo_list(*, resource: str, queryset, cache_params: dict | None = None):
    cache_params = cache_params or {}
    cache_key = build_geo_cache_key(resource, **cache_params)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    payload = serialize_geo_queryset(queryset)
    cache.set(cache_key, payload, timeout=GEO_CACHE_TTL_SECONDS)
    return Response(payload)


@api_view(["GET"])
@throttle_classes([GeoApiThrottle])
def public_geo_divisions(request):
    queryset = Division.objects.all()
    return _cached_geo_list(resource="divisions", queryset=queryset)


@api_view(["GET"])
@throttle_classes([GeoApiThrottle])
def public_geo_districts(request):
    try:
        division_id = validate_parent_id(
            request.query_params.get("divisionId"), param_name="divisionId"
        )
    except ValidationError as exc:
        raise ValidationError(exc.detail) from exc

    if not Division.objects.filter(pk=division_id).exists():
        raise ValidationError({"divisionId": "Division not found."})

    queryset = District.objects.filter(division_id=division_id)
    return _cached_geo_list(
        resource="districts",
        queryset=queryset,
        cache_params={"divisionId": division_id},
    )


@api_view(["GET"])
@throttle_classes([GeoApiThrottle])
def public_geo_upazilas(request):
    try:
        district_id = validate_parent_id(
            request.query_params.get("districtId"), param_name="districtId"
        )
    except ValidationError as exc:
        raise ValidationError(exc.detail) from exc

    if not District.objects.filter(pk=district_id).exists():
        raise ValidationError({"districtId": "District not found."})

    queryset = Upazila.objects.filter(district_id=district_id)
    return _cached_geo_list(
        resource="upazilas",
        queryset=queryset,
        cache_params={"districtId": district_id},
    )


@api_view(["GET"])
@throttle_classes([GeoApiThrottle])
def public_geo_unions(request):
    try:
        upazila_id = validate_parent_id(
            request.query_params.get("upazilaId"), param_name="upazilaId"
        )
    except ValidationError as exc:
        raise ValidationError(exc.detail) from exc

    if not Upazila.objects.filter(pk=upazila_id).exists():
        raise ValidationError({"upazilaId": "Upazila not found."})

    queryset = Union.objects.filter(upazila_id=upazila_id)
    return _cached_geo_list(
        resource="unions",
        queryset=queryset,
        cache_params={"upazilaId": upazila_id},
    )


@api_view(["GET"])
@throttle_classes([GeoApiThrottle])
def public_geo_villages(request):
    search = request.query_params.get("search")
    page = request.query_params.get("page", "1")
    page_size = request.query_params.get("pageSize")

    cache_key = build_geo_cache_key(
        "villages",
        search=search or "",
        page=page,
        pageSize=page_size or "",
    )
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    queryset = Village.objects.all()
    queryset = apply_geo_search(queryset, search)
    queryset = apply_geo_ordering(queryset, request.query_params.get("ordering"))

    paginator = GeoPageNumberPagination()
    page_obj = paginator.paginate_queryset(queryset, request)
    payload = {
        "count": paginator.page.paginator.count,
        "next": paginator.get_next_link(),
        "previous": paginator.get_previous_link(),
        "results": GeoNameSerializer(page_obj, many=True).data,
    }
    cache.set(cache_key, payload, timeout=GEO_CACHE_TTL_SECONDS)
    return Response(payload)
