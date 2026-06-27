from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser, IsActiveSuperuser
from customers.admin_serializers import (
    CustomerAdminSerializer,
    CustomerArchiveSerializer,
    CustomerHistorySerializer,
    CustomerVersionReadSerializer,
    CustomerVersionWriteSerializer,
)
from customers.filters import (
    apply_customer_archive_filter,
    apply_customer_ordering,
    apply_customer_search,
)
from customers.models import Customer
from customers.pagination import CustomerPageNumberPagination
from customers.search_ranking import normalize_search_text
from customers.services import get_customer_version_history
from follow_ups.admin_serializers import (
    CustomerFollowUpReadSerializer,
    CustomerFollowUpsResponseSerializer,
    CustomerFollowUpWriteSerializer,
)
from follow_ups.services import get_customer_follow_ups
from transactions.admin_serializers import CustomerBalanceSerializer, TransactionReadSerializer
from transactions.filters import apply_transaction_filters, apply_transaction_ordering
from transactions.models import Transaction
from transactions.pagination import TransactionPageNumberPagination
from transactions.services import calculate_customer_balance


class CustomerApiThrottle(ScopedRateThrottle):
    scope = "api"


class AdminCustomerViewSet(ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    pagination_class = CustomerPageNumberPagination
    throttle_classes = [CustomerApiThrottle]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = CustomerAdminSerializer
    queryset = Customer.objects.select_related("archived_by").all()
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "history":
            return [IsActiveSuperuser()]
        return [IsActiveAdminUser()]

    def get_serializer_class(self):
        if self.action == "create_version":
            return CustomerVersionWriteSerializer
        if self.action == "archive":
            return CustomerArchiveSerializer
        return CustomerAdminSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action != "list":
            return queryset

        search = self.request.query_params.get("search")
        has_search = bool(normalize_search_text(search))
        status = self.request.query_params.get("status")
        queryset = apply_customer_archive_filter(queryset, status)
        queryset = apply_customer_search(queryset, search)
        return apply_customer_ordering(
            queryset,
            self.request.query_params.get("ordering"),
            has_search=has_search,
        )

    @action(detail=True, methods=["get"], url_path="balance")
    def balance(self, request, pk=None):
        customer = self.get_object()
        summary = calculate_customer_balance(customer.pk)
        serializer = CustomerBalanceSerializer(
            {
                "customerId": summary.customer_id,
                "currentBalance": summary.current_balance,
                "totalInitial": summary.total_initial,
                "totalSales": summary.total_sales,
                "totalPayments": summary.total_payments,
                "transactionCount": summary.transaction_count,
                "cachedBalance": summary.cached_balance or summary.current_balance,
            }
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="transactions")
    def transactions(self, request, pk=None):
        customer = self.get_object()
        queryset = (
            Transaction.objects.filter(customer=customer)
            .select_related("customer", "created_by", "edited_by", "voided_by")
            .prefetch_related("items")
        )
        params = request.query_params
        include_history = params.get("includeHistory", "").lower() in {"1", "true", "yes"}
        queryset = apply_transaction_ordering(
            apply_transaction_filters(
                queryset,
                transaction_type=params.get("transactionType") or None,
                date_from=params.get("dateFrom") or None,
                date_to=params.get("dateTo") or None,
                search=params.get("search"),
                status=params.get("status") or None,
                include_history=include_history,
            ),
            params.get("ordering"),
        )
        paginator = TransactionPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = TransactionReadSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"], url_path="create-version")
    def create_version(self, request, pk=None):
        customer = self.get_object()
        serializer = CustomerVersionWriteSerializer(
            data=request.data,
            context={"request": request, "customer": customer},
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        customer_serializer = CustomerAdminSerializer(
            Customer.objects.get(pk=result.customer.pk),
            context={"request": request},
        )
        version_serializer = CustomerVersionReadSerializer(
            result.version,
            context={"request": request},
        )
        return Response(
            {
                "customer": customer_serializer.data,
                "version": version_serializer.data,
                "message": "Customer version created successfully.",
            },
            status=201,
        )

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        customer = self.get_object()
        serializer = CustomerArchiveSerializer(
            data=request.data,
            context={"request": request, "customer": customer},
        )
        serializer.is_valid(raise_exception=True)
        archived = serializer.save()
        customer_serializer = CustomerAdminSerializer(
            archived,
            context={"request": request},
        )
        return Response(
            {
                "customer": customer_serializer.data,
                "message": "Customer archived successfully.",
            }
        )

    @action(detail=True, methods=["get", "post"], url_path="follow-ups")
    def follow_ups(self, request, pk=None):
        customer = self.get_object()

        if request.method == "GET":
            result = get_customer_follow_ups(customer.pk)
            serializer = CustomerFollowUpsResponseSerializer(
                {
                    "active": result.active,
                    "history": result.history,
                }
            )
            return Response(serializer.data)

        serializer = CustomerFollowUpWriteSerializer(
            data=request.data,
            context={"request": request, "customer": customer},
        )
        serializer.is_valid(raise_exception=True)
        follow_up = serializer.save()
        read_serializer = CustomerFollowUpReadSerializer(follow_up)
        return Response(read_serializer.data, status=201)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        customer = self.get_object()
        versions = get_customer_version_history(customer.pk)
        serializer = CustomerHistorySerializer(
            {
                "customerId": customer.pk,
                "versions": versions,
            },
            context={"request": request},
        )
        return Response(serializer.data)
