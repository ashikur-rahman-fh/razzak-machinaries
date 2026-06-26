from django.utils import timezone
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveSuperuser
from dashboard.admin_serializers import DashboardSerializer
from dashboard.services import get_dashboard_data


class DashboardApiThrottle(ScopedRateThrottle):
    scope = "api"


def _to_response_payload(data) -> dict:
    yearly = data.yearly_stats
    return {
        "summary": {
            "totalDue": data.summary.total_due,
            "currentMonthSales": data.summary.current_month_sales,
            "currentMonthPayments": data.summary.current_month_payments,
            "currentMonthNetDueChange": data.summary.current_month_net_due_change,
            "totalCustomers": data.summary.total_customers,
            "totalTransactions": data.summary.total_transactions,
        },
        "recentTransactions": [
            {
                "id": tx.id,
                "displayId": tx.display_id,
                "customerId": tx.customer_id,
                "customerNameBn": tx.customer_name_bn,
                "customerNameEn": tx.customer_name_en,
                "transactionType": tx.transaction_type,
                "date": tx.date,
                "totalAmount": tx.total_amount,
                "updatedAt": tx.updated_at,
            }
            for tx in data.recent_transactions
        ],
        "recentCustomers": [
            {
                "id": c.id,
                "fullNameBn": c.full_name_bn,
                "fullNameEn": c.full_name_en,
                "phone": c.phone,
                "addressBn": c.address_bn,
                "addressEn": c.address_en,
                "currentBalance": c.current_balance,
                "updatedAt": c.updated_at,
            }
            for c in data.recent_customers
        ],
        "yearlyStats": {
            "year": yearly.year,
            "monthlySalesPayments": [
                {
                    "month": m.month,
                    "monthName": m.month_name,
                    "sales": m.sales,
                    "payments": m.payments,
                }
                for m in yearly.monthly_sales_payments
            ],
            "monthlyDueChange": [
                {
                    "month": m.month,
                    "monthName": m.month_name,
                    "netDueChange": m.net_due_change,
                }
                for m in yearly.monthly_due_change
            ],
            "monthlyTransactionCounts": [
                {
                    "month": m.month,
                    "monthName": m.month_name,
                    "salesCount": m.sales_count,
                    "paymentsCount": m.payments_count,
                    "initialCount": m.initial_count,
                }
                for m in yearly.monthly_transaction_counts
            ],
            "topCustomersByDue": [
                {
                    "customerId": c.customer_id,
                    "customerNameBn": c.customer_name_bn,
                    "customerNameEn": c.customer_name_en,
                    "currentBalance": c.current_balance,
                }
                for c in yearly.top_customers_by_due
            ],
            "yearlySalesTotal": yearly.yearly_sales_total,
            "yearlyPaymentsTotal": yearly.yearly_payments_total,
            "availableYears": yearly.available_years,
        },
    }


class AdminDashboardView(APIView):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveSuperuser]
    throttle_classes = [DashboardApiThrottle]

    def get(self, request):
        year_param = request.query_params.get("year")
        year = None
        if year_param is not None:
            try:
                year = int(year_param)
            except (TypeError, ValueError):
                year = timezone.localdate().year

        data = get_dashboard_data(year=year)
        serializer = DashboardSerializer(_to_response_payload(data))
        return Response(serializer.data)
