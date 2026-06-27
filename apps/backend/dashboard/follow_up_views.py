from datetime import datetime

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser
from follow_ups.admin_views import serialize_dashboard_follow_ups


class DashboardFollowUpsApiThrottle(ScopedRateThrottle):
    scope = "api"


class AdminDashboardFollowUpsView(APIView):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    throttle_classes = [DashboardFollowUpsApiThrottle]

    def get(self, request):
        as_of_param = request.query_params.get("asOf")
        as_of_date = None
        if as_of_param:
            try:
                as_of_date = datetime.strptime(as_of_param, "%Y-%m-%d").date()
            except ValueError:
                as_of_date = timezone.localdate()

        data = serialize_dashboard_follow_ups(as_of_date=as_of_date)
        return Response(data)
