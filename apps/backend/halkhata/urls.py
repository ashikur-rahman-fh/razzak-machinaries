from django.urls import include, path
from rest_framework.routers import DefaultRouter

from halkhata.admin_views import AdminHalkhataViewSet

router = DefaultRouter()
router.register("", AdminHalkhataViewSet, basename="admin-halkhata")

urlpatterns = [
    path("", include(router.urls)),
]
