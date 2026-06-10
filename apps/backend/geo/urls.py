from rest_framework.routers import DefaultRouter

from geo.admin_views import (
    DistrictAdminViewSet,
    DivisionAdminViewSet,
    UnionAdminViewSet,
    UpazilaAdminViewSet,
)

router = DefaultRouter()
router.register("divisions", DivisionAdminViewSet, basename="admin-geo-division")
router.register("districts", DistrictAdminViewSet, basename="admin-geo-district")
router.register("upazilas", UpazilaAdminViewSet, basename="admin-geo-upazila")
router.register("unions", UnionAdminViewSet, basename="admin-geo-union")

urlpatterns = router.urls
