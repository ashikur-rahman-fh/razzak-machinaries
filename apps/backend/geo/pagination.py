from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination


class GeoPageNumberPagination(PageNumberPagination):
    page_size = 50
    max_page_size = 200
    page_size_query_param = "pageSize"
    page_query_param = "page"

    def get_page_size(self, request):
        raw_size = request.query_params.get(self.page_size_query_param)
        if raw_size is None:
            return self.page_size

        try:
            page_size = int(raw_size)
        except (TypeError, ValueError) as exc:
            raise ValidationError({self.page_size_query_param: "Must be a valid integer."}) from exc

        if page_size <= 0:
            raise ValidationError({self.page_size_query_param: "Must be a positive integer."})
        if page_size > self.max_page_size:
            raise ValidationError(
                {self.page_size_query_param: f"Must not exceed {self.max_page_size}."}
            )
        return page_size

    def paginate_queryset(self, queryset, request, view=None):
        page_number = request.query_params.get(self.page_query_param, 1)
        try:
            int(page_number)
        except (TypeError, ValueError) as exc:
            raise ValidationError({self.page_query_param: "Must be a valid integer."}) from exc

        if int(page_number) <= 0:
            raise ValidationError({self.page_query_param: "Must be a positive integer."})

        return super().paginate_queryset(queryset, request, view)
