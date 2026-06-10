from django.db.models import Max


def next_geo_id(model) -> int:
    current = model.objects.aggregate(max_id=Max("id"))["max_id"]
    return (current or 0) + 1
