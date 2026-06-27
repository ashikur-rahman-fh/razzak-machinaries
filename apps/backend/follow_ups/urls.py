from django.urls import include, path
from rest_framework.routers import DefaultRouter

from follow_ups.admin_views import AdminFollowUpViewSet

router = DefaultRouter()
router.register("", AdminFollowUpViewSet, basename="admin-follow-up")

urlpatterns = [
    path("", include(router.urls)),
]
