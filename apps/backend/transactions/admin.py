from django.contrib import admin

from transactions.models import Transaction, TransactionItem


class TransactionItemInline(admin.TabularInline):
    model = TransactionItem
    extra = 0
    readonly_fields = [
        "product_name",
        "unit_price",
        "quantity",
        "line_total",
        "created_at",
        "updated_at",
    ]
    can_delete = False


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "transaction_type",
        "date",
        "total_amount",
        "created_at",
    ]
    list_filter = ["transaction_type", "date"]
    search_fields = ["customer__full_name_en", "customer__full_name_bn", "note"]
    readonly_fields = [
        "customer",
        "transaction_type",
        "date",
        "amount",
        "total_amount",
        "note",
        "payment_method",
        "created_by",
        "created_at",
        "updated_at",
    ]
    inlines = [TransactionItemInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TransactionItem)
class TransactionItemAdmin(admin.ModelAdmin):
    list_display = ["id", "transaction", "product_name", "quantity", "line_total"]
    readonly_fields = [
        "transaction",
        "product_name",
        "unit_price",
        "quantity",
        "line_total",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
