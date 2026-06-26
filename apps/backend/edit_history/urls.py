from django.urls import path

from edit_history.admin_views import AdminEditHistoryView

urlpatterns = [
    path("", AdminEditHistoryView.as_view(), name="admin-edit-history"),
]
