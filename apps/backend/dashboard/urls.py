from django.urls import path

from dashboard.admin_views import AdminDashboardView
from dashboard.follow_up_views import AdminDashboardFollowUpsView

urlpatterns = [
    path("", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("follow-ups/", AdminDashboardFollowUpsView.as_view(), name="admin-dashboard-follow-ups"),
]
