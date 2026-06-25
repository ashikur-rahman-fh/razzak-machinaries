from django.contrib import admin

from api.admin.bilingual import BilingualModelAdmin
from customers.models import Customer
from customers.validators import normalize_bangladesh_phone

_BILINGUAL_FIELDS = ("full_name", "address", "father_name", "mediator_name")


@admin.register(Customer)
class CustomerAdmin(BilingualModelAdmin):
    list_display = (
        "full_name_bn",
        "full_name_en",
        "phone",
        "memo_page_number_en",
        "created_at",
    )
    list_filter = ("created_at",)
    readonly_fields = ("phone", "created_at", "updated_at")
    search_fields = (
        *(f"{base}_bn" for base in _BILINGUAL_FIELDS),
        *(f"{base}_en" for base in _BILINGUAL_FIELDS),
        "phone",
        "phone_bn",
        "phone_en",
        "memo_page_number_bn",
        "memo_page_number_en",
    )
    fieldsets = (
        ("English Content", {"fields": tuple(f"{base}_en" for base in _BILINGUAL_FIELDS)}),
        ("Bangla Content", {"fields": tuple(f"{base}_bn" for base in _BILINGUAL_FIELDS)}),
        (
            "Phone",
            {
                "fields": ("phone_bn", "phone_en", "phone"),
                "description": ("Latin phone (phone_en) sets the normalized +880 phone on save."),
            },
        ),
        ("Memo page number", {"fields": ("memo_page_number_bn", "memo_page_number_en")}),
        ("Profile", {"fields": ("profile_picture",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if obj.phone_en:
            obj.phone = normalize_bangladesh_phone(obj.phone_en)
        super().save_model(request, obj, form, change)
