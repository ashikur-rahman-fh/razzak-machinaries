from rest_framework.routers import DefaultRouter

from api.admin.staff_users.views import AdminStaffUserViewSet

router = DefaultRouter()
router.register("", AdminStaffUserViewSet, basename="admin-staff-user")

urlpatterns = router.urls
