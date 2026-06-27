from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import GenericViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser
from api.admin.serializers import display_name_for_user
from follow_ups.admin_serializers import (
    CustomerFollowUpCancelSerializer,
    CustomerFollowUpCompleteSerializer,
    CustomerFollowUpReadSerializer,
    CustomerFollowUpUpdateSerializer,
    DashboardFollowUpsResponseSerializer,
)
from follow_ups.models import CustomerFollowUp
from follow_ups.services import get_dashboard_due_follow_ups


class FollowUpApiThrottle(ScopedRateThrottle):
    scope = "api"


def _actor_name(user) -> str | None:
    if user is None:
        return None
    name = display_name_for_user(user)
    return name or user.get_username()


def serialize_dashboard_follow_ups(*, as_of_date=None) -> dict:
    items = get_dashboard_due_follow_ups(as_of_date=as_of_date)
    payload = {
        "items": [
            {
                "id": item.follow_up.pk,
                "followUpDate": item.follow_up.follow_up_date,
                "isOverdue": item.is_overdue,
                "isToday": item.is_today,
                "note": item.follow_up.note,
                "assignedToName": _actor_name(item.follow_up.assigned_to),
                "createdByName": _actor_name(item.follow_up.created_by),
                "customer": {
                    "id": item.follow_up.customer_id,
                    "fullNameBn": item.follow_up.customer.full_name_bn,
                    "fullNameEn": item.follow_up.customer.full_name_en,
                    "phone": item.follow_up.customer.phone or item.follow_up.customer.phone_en,
                    "addressBn": item.follow_up.customer.address_bn,
                    "addressEn": item.follow_up.customer.address_en,
                    "currentBalance": item.current_balance,
                },
            }
            for item in items
        ]
    }
    serializer = DashboardFollowUpsResponseSerializer(payload)
    return serializer.data


class AdminFollowUpViewSet(mixins.UpdateModelMixin, GenericViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    throttle_classes = [FollowUpApiThrottle]
    queryset = CustomerFollowUp.objects.select_related(
        "customer",
        "assigned_to",
        "created_by",
        "completed_by",
        "rescheduled_from",
    )
    http_method_names = ["get", "patch", "post", "head", "options"]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "complete":
            return CustomerFollowUpCompleteSerializer
        if self.action == "cancel":
            return CustomerFollowUpCancelSerializer
        return CustomerFollowUpUpdateSerializer

    def partial_update(self, request, pk=None):
        follow_up = self.get_object()
        serializer = CustomerFollowUpUpdateSerializer(
            follow_up,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        read_serializer = CustomerFollowUpReadSerializer(updated)
        return Response(read_serializer.data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        follow_up = self.get_object()
        serializer = CustomerFollowUpCompleteSerializer(
            data=request.data,
            context={"request": request, "follow_up": follow_up},
        )
        serializer.is_valid(raise_exception=True)
        completed = serializer.save()
        read_serializer = CustomerFollowUpReadSerializer(completed)
        return Response(read_serializer.data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        follow_up = self.get_object()
        serializer = CustomerFollowUpCancelSerializer(
            data=request.data,
            context={"request": request, "follow_up": follow_up},
        )
        serializer.is_valid(raise_exception=True)
        cancelled = serializer.save()
        read_serializer = CustomerFollowUpReadSerializer(cancelled)
        return Response(read_serializer.data)
