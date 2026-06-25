from rest_framework.routers import DefaultRouter

from transactions.admin_views import AdminTransactionViewSet

router = DefaultRouter()
router.register("", AdminTransactionViewSet, basename="admin-transaction")

urlpatterns = router.urls
