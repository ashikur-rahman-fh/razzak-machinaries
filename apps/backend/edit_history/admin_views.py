from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from edit_history.admin_serializers import EditHistoryEventSerializer
from edit_history.pagination import EditHistoryPageNumberPagination
from edit_history.services import collect_edit_history_events


class EditHistoryApiThrottle(ScopedRateThrottle):
    scope = "api"


def _event_to_payload(event) -> dict:
    return {
        "id": event.id,
        "eventType": event.event_type,
        "occurredAt": event.occurred_at,
        "actorName": event.actor_name,
        "reason": event.reason,
        "entityType": event.entity_type,
        "entityId": event.entity_id,
        "entityLabelEn": event.entity_label_en,
        "entityLabelBn": event.entity_label_bn,
        "status": event.status,
        "customerId": event.customer_id,
        "transactionDisplayId": event.transaction_display_id,
    }


class AdminEditHistoryView(APIView):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    throttle_classes = [EditHistoryApiThrottle]
    pagination_class = EditHistoryPageNumberPagination

    def get(self, request):
        events = collect_edit_history_events(
            event_type=request.query_params.get("eventType"),
            search=request.query_params.get("search"),
            date_from=request.query_params.get("dateFrom"),
            date_to=request.query_params.get("dateTo"),
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(events, request, view=self)
        serializer = EditHistoryEventSerializer(
            [_event_to_payload(event) for event in page],
            many=True,
        )
        return paginator.get_paginated_response(serializer.data)
