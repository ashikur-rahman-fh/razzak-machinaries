from django.urls import path
from rest_framework.routers import DefaultRouter

from geo.admin_views import (
    DistrictAdminViewSet,
    DivisionAdminViewSet,
    UnionAdminViewSet,
    UpazilaAdminViewSet,
    VillageAdminViewSet,
    VillageImportView,
)

router = DefaultRouter()
router.register("divisions", DivisionAdminViewSet, basename="admin-geo-division")
router.register("districts", DistrictAdminViewSet, basename="admin-geo-district")
router.register("upazilas", UpazilaAdminViewSet, basename="admin-geo-upazila")
router.register("unions", UnionAdminViewSet, basename="admin-geo-union")
router.register("villages", VillageAdminViewSet, basename="admin-geo-village")

urlpatterns = [
    path("villages/import/", VillageImportView.as_view(), name="admin-geo-village-import"),
    *router.urls,
]
