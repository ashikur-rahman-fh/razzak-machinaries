from rest_framework.decorators import action
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from transactions.admin_serializers import (
    TransactionConfirmationSerializer,
    TransactionReadSerializer,
    TransactionWriteSerializer,
)
from transactions.exceptions import ConfirmationNotAvailable
from transactions.filters import apply_transaction_filters, apply_transaction_ordering
from transactions.models import Transaction, TransactionType
from transactions.pagination import TransactionPageNumberPagination
from transactions.services import calculate_customer_balance


class TransactionApiThrottle(ScopedRateThrottle):
    scope = "api"


class AdminTransactionViewSet(ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    pagination_class = TransactionPageNumberPagination
    throttle_classes = [TransactionApiThrottle]
    parser_classes = [JSONParser]
    queryset = Transaction.objects.select_related("customer", "created_by").prefetch_related(
        "items"
    )
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return TransactionWriteSerializer
        return TransactionReadSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        customer_id = params.get("customerId")
        return apply_transaction_ordering(
            apply_transaction_filters(
                queryset,
                customer_id=int(customer_id) if customer_id else None,
                transaction_type=params.get("transactionType") or None,
                date_from=params.get("dateFrom") or None,
                date_to=params.get("dateTo") or None,
                search=params.get("search"),
            ),
            params.get("ordering"),
        )

    def create(self, request, *args, **kwargs):
        write_serializer = TransactionWriteSerializer(
            data=request.data, context={"request": request}
        )
        write_serializer.is_valid(raise_exception=True)
        transaction_obj = write_serializer.save()
        read_serializer = TransactionReadSerializer(
            Transaction.objects.select_related("customer", "created_by")
            .prefetch_related("items")
            .get(pk=transaction_obj.pk),
            context={"request": request},
        )
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=201, headers=headers)

    @action(detail=True, methods=["get"], url_path="confirmation")
    def confirmation(self, request, pk=None):
        transaction_obj = self.get_object()
        if transaction_obj.transaction_type == TransactionType.INITIAL:
            raise ConfirmationNotAvailable()

        customer = transaction_obj.customer
        balance = calculate_customer_balance(customer.pk)
        customer_phone = customer.phone or customer.phone_bn or customer.phone_en or ""

        serializer = TransactionConfirmationSerializer(
            {
                "id": transaction_obj.pk,
                "displayId": f"COM-{transaction_obj.pk}",
                "transactionType": transaction_obj.transaction_type,
                "date": transaction_obj.date,
                "totalAmount": transaction_obj.total_amount,
                "note": transaction_obj.note,
                "paymentMethod": transaction_obj.payment_method,
                "customerId": customer.pk,
                "customerNameBn": customer.full_name_bn,
                "customerNameEn": customer.full_name_en,
                "customerAddressBn": customer.address_bn,
                "customerAddressEn": customer.address_en,
                "customerPhone": customer_phone,
                "items": transaction_obj.items.all(),
                "currentBalance": balance.current_balance,
            }
        )
        return Response(serializer.data)
