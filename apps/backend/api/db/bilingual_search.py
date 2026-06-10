from django.db.models import Q


def bilingual_icontains(queryset, query: str, *field_bases: str):
    normalized = query.strip()
    if not normalized:
        return queryset

    combined = Q()
    for base in field_bases:
        combined |= Q(**{f"{base}_en__icontains": normalized})
        combined |= Q(**{f"{base}_bn__icontains": normalized})
    return queryset.filter(combined)
