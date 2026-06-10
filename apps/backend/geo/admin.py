from django.contrib import admin

from .models import District, Division, Union, Upazila


class ReadOnlyGeoAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Division)
class DivisionAdmin(ReadOnlyGeoAdmin):
    list_display = ("id", "name_en", "name_bn")
    search_fields = ("name_en", "name_bn")


@admin.register(District)
class DistrictAdmin(ReadOnlyGeoAdmin):
    list_display = ("id", "name_en", "name_bn", "division")
    list_filter = ("division",)
    search_fields = ("name_en", "name_bn")
    raw_id_fields = ("division",)


@admin.register(Upazila)
class UpazilaAdmin(ReadOnlyGeoAdmin):
    list_display = ("id", "name_en", "name_bn", "district")
    list_filter = ("district__division", "district")
    search_fields = ("name_en", "name_bn")
    raw_id_fields = ("district",)


@admin.register(Union)
class UnionAdmin(ReadOnlyGeoAdmin):
    list_display = ("id", "name_en", "name_bn", "upazila")
    list_filter = ("upazila__district__division", "upazila__district", "upazila")
    search_fields = ("name_en", "name_bn")
    raw_id_fields = ("upazila",)
