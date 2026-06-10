from rest_framework import status
from rest_framework.exceptions import APIException

GEO_HAS_CHILDREN_CODE = "GEO_HAS_CHILDREN"
GEO_HAS_CHILDREN_MESSAGE = "This area cannot be deleted because it has child records."

GEO_ID_CONFLICT_CODE = "GEO_ID_CONFLICT"
GEO_ID_CONFLICT_MESSAGE = "An area with this ID already exists."


class GeoHasChildren(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = GEO_HAS_CHILDREN_CODE
    default_detail = GEO_HAS_CHILDREN_MESSAGE

    def __init__(self, *, child_type: str, count: int | None = None):
        details: dict[str, str | int] = {"childType": child_type}
        if count is not None:
            details["count"] = count
        super().__init__(detail=details)


class GeoIdConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = GEO_ID_CONFLICT_CODE
    default_detail = GEO_ID_CONFLICT_MESSAGE
