from rest_framework.decorators import action
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser, IsActiveSuperuser, is_superuser_admin
from transactions.admin_serializers import (
    TransactionConfirmationSerializer,
    TransactionCorrectionWriteSerializer,
    TransactionHistorySerializer,
    TransactionReadSerializer,
    TransactionVoidSerializer,
    TransactionWriteSerializer,
)
from transactions.exceptions import ConfirmationNotAvailable
from transactions.filters import apply_transaction_filters, apply_transaction_ordering
from transactions.models import Transaction, TransactionStatus, TransactionType
from transactions.pagination import TransactionPageNumberPagination
from transactions.services import (
    calculate_customer_balance,
    get_transaction_history,
    resolve_transaction_for_staff_view,
)


class TransactionApiThrottle(ScopedRateThrottle):
    scope = "api"


def _transaction_queryset():
    return Transaction.objects.select_related(
        "customer",
        "created_by",
        "edited_by",
        "voided_by",
        "previous_version",
        "root_transaction",
    ).prefetch_related("items")


class AdminTransactionViewSet(ModelViewSet):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    pagination_class = TransactionPageNumberPagination
    throttle_classes = [TransactionApiThrottle]
    parser_classes = [JSONParser]
    queryset = _transaction_queryset()
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "history":
            return [IsActiveSuperuser()]
        return [IsActiveAdminUser()]

    def get_serializer_class(self):
        if self.action == "create":
            return TransactionWriteSerializer
        if self.action == "create_correction":
            return TransactionCorrectionWriteSerializer
        if self.action == "void":
            return TransactionVoidSerializer
        return TransactionReadSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {"retrieve", "confirmation"}:
            return queryset
        params = self.request.query_params
        customer_id = params.get("customerId")
        include_history = params.get("includeHistory", "").lower() in {"1", "true", "yes"}
        if not is_superuser_admin(self.request.user):
            include_history = False
        return apply_transaction_ordering(
            apply_transaction_filters(
                queryset,
                customer_id=int(customer_id) if customer_id else None,
                transaction_type=params.get("transactionType") or None,
                date_from=params.get("dateFrom") or None,
                date_to=params.get("dateTo") or None,
                search=params.get("search"),
                status=params.get("status") or None,
                include_history=include_history,
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
            _transaction_queryset().get(pk=transaction_obj.pk),
            context={"request": request},
        )
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=201, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not is_superuser_admin(request.user):
            instance = resolve_transaction_for_staff_view(instance)
            instance = _transaction_queryset().get(pk=instance.pk)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="create-correction")
    def create_correction(self, request, pk=None):
        source = self.get_object()
        serializer = TransactionCorrectionWriteSerializer(
            data=request.data,
            context={"request": request, "source": source},
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        old_serializer = TransactionReadSerializer(
            _transaction_queryset().get(pk=result.old_transaction.pk),
            context={"request": request},
        )
        new_serializer = TransactionReadSerializer(
            _transaction_queryset().get(pk=result.new_transaction.pk),
            context={"request": request},
        )
        return Response(
            {
                "oldTransaction": old_serializer.data,
                "newTransaction": new_serializer.data,
                "message": "Transaction correction created successfully.",
            },
            status=201,
        )

    @action(detail=True, methods=["post"], url_path="void")
    def void(self, request, pk=None):
        source = self.get_object()
        serializer = TransactionVoidSerializer(
            data=request.data,
            context={"request": request, "source": source},
        )
        serializer.is_valid(raise_exception=True)
        voided = serializer.save()
        read_serializer = TransactionReadSerializer(
            _transaction_queryset().get(pk=voided.pk),
            context={"request": request},
        )
        return Response(
            {
                "transaction": read_serializer.data,
                "message": "Transaction voided successfully.",
            }
        )

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        versions = get_transaction_history(int(pk))
        root_id = versions[0].root_transaction_id if versions else int(pk)
        serializer = TransactionHistorySerializer(
            {
                "rootTransactionId": root_id,
                "versions": versions,
            },
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="confirmation")
    def confirmation(self, request, pk=None):
        transaction_obj = self.get_object()
        if not is_superuser_admin(request.user):
            transaction_obj = resolve_transaction_for_staff_view(transaction_obj)
            transaction_obj = _transaction_queryset().get(pk=transaction_obj.pk)
        if transaction_obj.transaction_type == TransactionType.INITIAL:
            raise ConfirmationNotAvailable()

        balance = calculate_customer_balance(transaction_obj.customer_id)
        root_id = transaction_obj.root_transaction_id or transaction_obj.pk
        latest = (
            Transaction.objects.filter(root_transaction_id=root_id)
            .order_by("-version_number", "-id")
            .first()
        )
        latest_version_id = latest.pk if latest else transaction_obj.pk
        is_historical = (
            not transaction_obj.is_current or transaction_obj.status != TransactionStatus.ACTIVE
        )

        serializer = TransactionConfirmationSerializer(
            {
                "id": transaction_obj.pk,
                "displayId": transaction_obj.display_id,
                "transactionType": transaction_obj.transaction_type,
                "date": transaction_obj.date,
                "totalAmount": transaction_obj.total_amount,
                "note": transaction_obj.note,
                "paymentMethod": transaction_obj.payment_method,
                "customerId": transaction_obj.customer_id,
                "customerNameBn": transaction_obj.customer_name_bn,
                "customerNameEn": transaction_obj.customer_name_en,
                "customerAddressBn": transaction_obj.customer_address_bn,
                "customerAddressEn": transaction_obj.customer_address_en,
                "customerPhone": transaction_obj.customer_phone,
                "items": transaction_obj.items.all(),
                "currentBalance": balance.current_balance,
                "status": transaction_obj.status,
                "isCurrent": transaction_obj.is_current,
                "versionNumber": transaction_obj.version_number,
                "latestVersionId": latest_version_id,
                "isHistorical": is_historical,
                "previousVersionId": transaction_obj.previous_version_id,
                "editReason": transaction_obj.edit_reason,
                "voidReason": transaction_obj.void_reason,
            }
        )
        return Response(serializer.data)
