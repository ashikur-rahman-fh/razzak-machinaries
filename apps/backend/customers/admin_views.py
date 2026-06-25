from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from customers.admin_serializers import CustomerAdminSerializer
from customers.filters import apply_customer_ordering, apply_customer_search
from customers.models import Customer
from customers.pagination import CustomerPageNumberPagination
from customers.search_ranking import normalize_search_text
from transactions.admin_serializers import CustomerBalanceSerializer, TransactionReadSerializer
from transactions.filters import apply_transaction_filters, apply_transaction_ordering
from transactions.models import Transaction
from transactions.pagination import TransactionPageNumberPagination
from transactions.services import calculate_customer_balance


class CustomerApiThrottle(ScopedRateThrottle):
    scope = "api"


class AdminCustomerViewSet(ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    pagination_class = CustomerPageNumberPagination
    throttle_classes = [CustomerApiThrottle]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = CustomerAdminSerializer
    queryset = Customer.objects.all()
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action != "list":
            return queryset

        search = self.request.query_params.get("search")
        has_search = bool(normalize_search_text(search))
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
            .select_related("customer", "created_by")
            .prefetch_related("items")
        )
        params = request.query_params
        queryset = apply_transaction_ordering(
            apply_transaction_filters(
                queryset,
                transaction_type=params.get("transactionType") or None,
                date_from=params.get("dateFrom") or None,
                date_to=params.get("dateTo") or None,
                search=params.get("search"),
            ),
            params.get("ordering"),
        )
        paginator = TransactionPageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = TransactionReadSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
