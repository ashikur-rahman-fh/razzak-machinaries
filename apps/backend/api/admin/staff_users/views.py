from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.password_utils import generate_readable_temporary_password
from api.admin.permissions import IsActiveSuperuser
from api.admin.staff_profile import ensure_staff_profile
from api.admin.staff_users.filters import (
    apply_staff_user_ordering,
    apply_staff_user_search,
    apply_staff_user_status_filter,
)
from api.admin.staff_users.pagination import StaffUserPageNumberPagination
from api.admin.staff_users.serializers import (
    StaffUserCreateSerializer,
    StaffUserUpdateSerializer,
    serialize_staff_user,
)

User = get_user_model()


class StaffUserApiThrottle(ScopedRateThrottle):
    scope = "api"


class StaffPasswordApiThrottle(ScopedRateThrottle):
    scope = "admin_staff_password"


class AdminStaffUserViewSet(ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    pagination_class = StaffUserPageNumberPagination
    throttle_classes = [StaffUserApiThrottle]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = (
            User.objects.filter(is_staff=True, is_superuser=False)
            .select_related(
                "staff_profile", "staff_profile__created_by", "staff_profile__updated_by"
            )
            .all()
        )
        if self.action != "list":
            return queryset

        params = self.request.query_params
        queryset = apply_staff_user_search(queryset, params.get("search"))
        queryset = apply_staff_user_status_filter(queryset, params.get("status"))
        return apply_staff_user_ordering(queryset, params.get("ordering"))

    def get_serializer_class(self):
        if self.action == "create":
            return StaffUserCreateSerializer
        if self.action in {"partial_update", "update"}:
            return StaffUserUpdateSerializer
        return StaffUserCreateSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action in {"partial_update", "update"} and self.kwargs.get("pk"):
            context["instance"] = self.get_object()
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = [serialize_staff_user(user) for user in page]
        return self.get_paginated_response(items)

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        return Response(serialize_staff_user(user))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        payload = serialize_staff_user(user)
        payload["temporaryPassword"] = serializer.context.get("temporary_password")
        return Response(payload, status=201)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = (
            User.objects.filter(pk=user.pk)
            .select_related(
                "staff_profile", "staff_profile__created_by", "staff_profile__updated_by"
            )
            .get()
        )
        return Response(serialize_staff_user(user))

    @action(
        detail=False,
        methods=["post"],
        url_path="generate-temp-password",
        throttle_classes=[StaffPasswordApiThrottle],
    )
    def generate_temp_password(self, request):
        user = User(
            username="tempuser",
            email="temp@example.com",
            first_name="Temp",
            last_name="User",
        )
        password = generate_readable_temporary_password(user=user)
        return Response({"temporaryPassword": password})

    @action(
        detail=True,
        methods=["post"],
        url_path="reset-temp-password",
        throttle_classes=[StaffPasswordApiThrottle],
    )
    @transaction.atomic
    def reset_temp_password(self, request, pk=None):
        user = self.get_object()
        password = generate_readable_temporary_password(user=user)
        user.set_password(password)
        user.save(update_fields=["password"])
        ensure_staff_profile(
            user,
            must_change_password=False,
            updated_by=request.user,
        )
        payload = serialize_staff_user(user)
        payload["temporaryPassword"] = password
        return Response(payload)
