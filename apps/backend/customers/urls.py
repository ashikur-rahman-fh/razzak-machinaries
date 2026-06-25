from rest_framework.routers import DefaultRouter

from customers.admin_views import AdminCustomerViewSet

router = DefaultRouter()
router.register("", AdminCustomerViewSet, basename="admin-customer")

urlpatterns = router.urls
