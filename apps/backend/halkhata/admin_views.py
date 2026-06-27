from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import GenericViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser
from halkhata.admin_serializers import (
    HalkhataDetailSerializer,
    HalkhataPaymentWriteSerializer,
    HalkhataReadSerializer,
    HalkhataStatsSerializer,
    HalkhataTransactionSerializer,
    HalkhataUpdateSerializer,
    HalkhataWriteSerializer,
)
from halkhata.filters import (
    apply_halkhata_status_filter,
    apply_halkhata_transaction_filters,
    apply_halkhata_transaction_ordering,
)
from halkhata.models import Halkhata
from halkhata.pagination import HalkhataPageNumberPagination
from halkhata.services import (
    annotate_halkhata_payment_numbers,
    compute_halkhata_stats,
    get_halkhata_payment_queryset,
)
from transactions.admin_serializers import TransactionReadSerializer
from transactions.admin_views import _transaction_queryset


class HalkhataApiThrottle(ScopedRateThrottle):
    scope = "api"


class AdminHalkhataViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    GenericViewSet,
):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    throttle_classes = [HalkhataApiThrottle]
    pagination_class = HalkhataPageNumberPagination
    queryset = Halkhata.objects.select_related("created_by")
    http_method_names = ["get", "post", "patch", "head", "options"]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.action == "create":
            return HalkhataWriteSerializer
        if self.action in {"update", "partial_update"}:
            return HalkhataUpdateSerializer
        if self.action == "retrieve":
            return HalkhataDetailSerializer
        if self.action == "create_payment":
            return HalkhataPaymentWriteSerializer
        if self.action == "transactions":
            return HalkhataTransactionSerializer
        return HalkhataReadSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            queryset = apply_halkhata_status_filter(
                queryset,
                self.request.query_params.get("status"),
            )
            return queryset.order_by("-date", "-created_at", "-id")
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = HalkhataWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        halkhata = serializer.save()
        read_serializer = HalkhataDetailSerializer(halkhata)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = HalkhataDetailSerializer(instance)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        halkhata = self.get_object()
        serializer = HalkhataUpdateSerializer(
            halkhata,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        read_serializer = HalkhataDetailSerializer(updated)
        return Response(read_serializer.data)

    @action(detail=True, methods=["get"], url_path="stats")
    def stats(self, request, pk=None):
        halkhata = self.get_object()
        stats = compute_halkhata_stats(halkhata)
        serializer = HalkhataStatsSerializer(
            {
                "totalCollected": stats.total_collected,
                "paymentCount": stats.payment_count,
                "averagePayment": stats.average_payment,
                "highestPayment": stats.highest_payment,
                "uniqueCustomersPaid": stats.unique_customers_paid,
                "todayCollection": stats.today_collection,
                "remainingDueOfPaidCustomers": stats.remaining_due_of_paid_customers,
            }
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="transactions")
    def transactions(self, request, pk=None):
        halkhata = self.get_object()
        queryset = annotate_halkhata_payment_numbers(get_halkhata_payment_queryset(halkhata.pk))
        queryset = apply_halkhata_transaction_filters(
            queryset,
            search=request.query_params.get("search"),
        )
        queryset = apply_halkhata_transaction_ordering(
            queryset,
            request.query_params.get("ordering"),
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = HalkhataTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = HalkhataTransactionSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="payments")
    def create_payment(self, request, pk=None):
        halkhata = self.get_object()
        serializer = HalkhataPaymentWriteSerializer(
            data=request.data,
            context={"request": request, "halkhata": halkhata},
        )
        serializer.is_valid(raise_exception=True)
        transaction_obj = serializer.save()
        read_serializer = TransactionReadSerializer(
            _transaction_queryset().get(pk=transaction_obj.pk),
            context={"request": request},
        )
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
