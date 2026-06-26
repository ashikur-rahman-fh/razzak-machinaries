import calendar
from dataclasses import dataclass
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import ExtractMonth, ExtractYear
from django.utils import timezone

from customers.models import Customer
from transactions.models import Transaction, TransactionType
from transactions.money import quantize_money
from transactions.services import aggregate_amount_by_type, calculate_global_due


@dataclass(frozen=True)
class DashboardSummary:
    total_due: Decimal
    current_month_sales: Decimal
    current_month_payments: Decimal
    current_month_net_due_change: Decimal
    total_customers: int
    total_transactions: int


@dataclass(frozen=True)
class RecentTransaction:
    id: int
    display_id: str
    customer_id: int
    customer_name_bn: str
    customer_name_en: str
    transaction_type: str
    date: str
    total_amount: Decimal
    updated_at: str


@dataclass(frozen=True)
class RecentCustomer:
    id: int
    full_name_bn: str
    full_name_en: str
    phone: str
    address_bn: str
    address_en: str
    current_balance: Decimal
    updated_at: str


@dataclass(frozen=True)
class MonthlySalesPayments:
    month: int
    month_name: str
    sales: Decimal
    payments: Decimal


@dataclass(frozen=True)
class MonthlyDueChange:
    month: int
    month_name: str
    net_due_change: Decimal


@dataclass(frozen=True)
class MonthlyTransactionCounts:
    month: int
    month_name: str
    sales_count: int
    payments_count: int
    initial_count: int


@dataclass(frozen=True)
class TopCustomerByDue:
    customer_id: int
    customer_name_bn: str
    customer_name_en: str
    current_balance: Decimal


@dataclass(frozen=True)
class YearlyStats:
    year: int
    monthly_sales_payments: list[MonthlySalesPayments]
    monthly_due_change: list[MonthlyDueChange]
    monthly_transaction_counts: list[MonthlyTransactionCounts]
    top_customers_by_due: list[TopCustomerByDue]
    yearly_sales_total: Decimal
    yearly_payments_total: Decimal
    available_years: list[int]


@dataclass(frozen=True)
class DashboardData:
    summary: DashboardSummary
    recent_transactions: list[RecentTransaction]
    recent_customers: list[RecentCustomer]
    yearly_stats: YearlyStats


def _month_name(month: int) -> str:
    return calendar.month_name[month]


def _empty_monthly_data() -> tuple[dict, dict, dict]:
    sales_by_month: dict[int, Decimal] = {m: Decimal("0") for m in range(1, 13)}
    payments_by_month: dict[int, Decimal] = {m: Decimal("0") for m in range(1, 13)}
    counts_by_month: dict[int, dict[str, int]] = {
        m: {"sales_count": 0, "payments_count": 0, "initial_count": 0} for m in range(1, 13)
    }
    return sales_by_month, payments_by_month, counts_by_month


def _build_yearly_stats(year: int) -> YearlyStats:
    sales_by_month, payments_by_month, counts_by_month = _empty_monthly_data()

    rows = (
        Transaction.objects.filter(date__year=year)
        .annotate(month=ExtractMonth("date"))
        .values("month", "transaction_type")
        .annotate(total=Sum("total_amount"), count=Count("id"))
    )

    for row in rows:
        month = row["month"]
        if month is None:
            continue
        tx_type = row["transaction_type"]
        total = quantize_money(row["total"] or Decimal("0"))
        count = row["count"] or 0

        if tx_type == TransactionType.SALE:
            sales_by_month[month] = total
            counts_by_month[month]["sales_count"] = count
        elif tx_type == TransactionType.PAYMENT:
            payments_by_month[month] = total
            counts_by_month[month]["payments_count"] = count
        elif tx_type == TransactionType.INITIAL:
            counts_by_month[month]["initial_count"] = count

    monthly_sales_payments = [
        MonthlySalesPayments(
            month=m,
            month_name=_month_name(m),
            sales=sales_by_month[m],
            payments=payments_by_month[m],
        )
        for m in range(1, 13)
    ]

    monthly_due_change = [
        MonthlyDueChange(
            month=m,
            month_name=_month_name(m),
            net_due_change=quantize_money(sales_by_month[m] - payments_by_month[m]),
        )
        for m in range(1, 13)
    ]

    monthly_transaction_counts = [
        MonthlyTransactionCounts(
            month=m,
            month_name=_month_name(m),
            sales_count=counts_by_month[m]["sales_count"],
            payments_count=counts_by_month[m]["payments_count"],
            initial_count=counts_by_month[m]["initial_count"],
        )
        for m in range(1, 13)
    ]

    year_queryset = Transaction.objects.filter(date__year=year)
    yearly_sales_total = aggregate_amount_by_type(year_queryset, TransactionType.SALE)
    yearly_payments_total = aggregate_amount_by_type(year_queryset, TransactionType.PAYMENT)

    top_customers = Customer.objects.order_by("-cached_balance", "id")[:10]
    top_customers_by_due = [
        TopCustomerByDue(
            customer_id=c.id,
            customer_name_bn=c.full_name_bn,
            customer_name_en=c.full_name_en,
            current_balance=c.cached_balance,
        )
        for c in top_customers
    ]

    distinct_years = list(
        Transaction.objects.annotate(y=ExtractYear("date"))
        .values_list("y", flat=True)
        .distinct()
        .order_by("y")
    )
    current_year = timezone.localdate().year
    available_years = distinct_years if distinct_years else [current_year]
    if current_year not in available_years:
        available_years = sorted([*available_years, current_year])

    return YearlyStats(
        year=year,
        monthly_sales_payments=monthly_sales_payments,
        monthly_due_change=monthly_due_change,
        monthly_transaction_counts=monthly_transaction_counts,
        top_customers_by_due=top_customers_by_due,
        yearly_sales_total=yearly_sales_total,
        yearly_payments_total=yearly_payments_total,
        available_years=available_years,
    )


def get_dashboard_data(year: int | None = None) -> DashboardData:
    today = timezone.localdate()
    selected_year = year if year is not None else today.year

    current_month_queryset = Transaction.objects.filter(
        date__year=today.year,
        date__month=today.month,
    )
    current_month_sales = aggregate_amount_by_type(current_month_queryset, TransactionType.SALE)
    current_month_payments = aggregate_amount_by_type(
        current_month_queryset, TransactionType.PAYMENT
    )
    current_month_net_due_change = quantize_money(current_month_sales - current_month_payments)

    summary = DashboardSummary(
        total_due=calculate_global_due(),
        current_month_sales=current_month_sales,
        current_month_payments=current_month_payments,
        current_month_net_due_change=current_month_net_due_change,
        total_customers=Customer.objects.count(),
        total_transactions=Transaction.objects.count(),
    )

    recent_tx_qs = Transaction.objects.select_related("customer").order_by("-updated_at")[:10]
    recent_transactions = [
        RecentTransaction(
            id=tx.id,
            display_id=f"COM-{tx.id}",
            customer_id=tx.customer_id,
            customer_name_bn=tx.customer.full_name_bn,
            customer_name_en=tx.customer.full_name_en,
            transaction_type=tx.transaction_type,
            date=tx.date.isoformat(),
            total_amount=tx.total_amount,
            updated_at=tx.updated_at.isoformat(),
        )
        for tx in recent_tx_qs
    ]

    recent_cust_qs = Customer.objects.order_by("-updated_at")[:10]
    recent_customers = [
        RecentCustomer(
            id=c.id,
            full_name_bn=c.full_name_bn,
            full_name_en=c.full_name_en,
            phone=c.phone,
            address_bn=c.address_bn,
            address_en=c.address_en,
            current_balance=c.cached_balance,
            updated_at=c.updated_at.isoformat(),
        )
        for c in recent_cust_qs
    ]

    yearly_stats = _build_yearly_stats(selected_year)

    return DashboardData(
        summary=summary,
        recent_transactions=recent_transactions,
        recent_customers=recent_customers,
        yearly_stats=yearly_stats,
    )
