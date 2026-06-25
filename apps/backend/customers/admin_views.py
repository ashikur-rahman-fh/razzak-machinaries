from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import ModelViewSet

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from customers.admin_serializers import CustomerAdminSerializer
from customers.filters import apply_customer_ordering, apply_customer_search
from customers.models import Customer
from customers.pagination import CustomerPageNumberPagination
from customers.search_ranking import normalize_search_text


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
        search = self.request.query_params.get("search")
        has_search = bool(normalize_search_text(search))
        queryset = apply_customer_search(queryset, search)
        return apply_customer_ordering(
            queryset,
            self.request.query_params.get("ordering"),
            has_search=has_search,
        )
