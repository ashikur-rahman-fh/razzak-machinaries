from django.urls import path

from dashboard.admin_views import AdminDashboardView

urlpatterns = [
    path("", AdminDashboardView.as_view(), name="admin-dashboard"),
]
