from __future__ import annotations

import re

from django.db.models import Case, FloatField, Q, Value, When

_BANGLA_DIGIT_TRANSLATION = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
_LATIN_DIGIT_TRANSLATION = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")


def bangla_to_latin_digits(value: str) -> str:
    return value.translate(_BANGLA_DIGIT_TRANSLATION)


def latin_to_bangla_digits(value: str) -> str:
    return value.translate(_LATIN_DIGIT_TRANSLATION)


def expand_bilingual_search_terms(query: str) -> list[str]:
    """Build deduplicated search terms for cross-script digit matching."""
    normalized = query.strip()
    if not normalized:
        return []

    terms: list[str] = []
    seen: set[str] = set()

    def add(term: str) -> None:
        if term and term not in seen:
            seen.add(term)
            terms.append(term)

    add(normalized)

    latin_digits = bangla_to_latin_digits(normalized)
    add(latin_digits)

    digits_only = re.sub(r"\D", "", latin_digits)
    if digits_only:
        add(digits_only)
        add(latin_to_bangla_digits(digits_only))

    return terms


def bilingual_icontains_q(query: str, *field_bases: str) -> Q:
    combined = Q()
    for term in expand_bilingual_search_terms(query):
        for base in field_bases:
            combined |= Q(**{f"{base}_en__icontains": term})
            combined |= Q(**{f"{base}_bn__icontains": term})
    return combined


def bilingual_field_icontains_q(query: str, *fields: str) -> Q:
    combined = Q()
    for term in expand_bilingual_search_terms(query):
        for field in fields:
            combined |= Q(**{f"{field}__icontains": term})
    return combined


def bilingual_icontains(queryset, query: str, *field_bases: str):
    normalized = query.strip()
    if not normalized:
        return queryset
    return queryset.filter(bilingual_icontains_q(normalized, *field_bases))


def bilingual_icontains_score_cases(
    fields: tuple[str, ...],
    query: str,
    points: float,
) -> list[When]:
    whens: list[When] = []
    for term in expand_bilingual_search_terms(query):
        whens.extend(When(**{f"{field}__icontains": term}, then=Value(points)) for field in fields)
    return whens


def bilingual_prefix_score_cases(
    fields: tuple[str, ...],
    query: str,
    points: float,
) -> list[When]:
    whens: list[When] = []
    for term in expand_bilingual_search_terms(query):
        whens.extend(
            When(**{f"{field}__istartswith": term}, then=Value(points)) for field in fields
        )
    return whens


def bilingual_icontains_score(fields: tuple[str, ...], query: str, points: float) -> Case:
    whens = bilingual_icontains_score_cases(fields, query, points)
    return Case(*whens, default=Value(0.0), output_field=FloatField())


def bilingual_prefix_score(fields: tuple[str, ...], query: str, points: float) -> Case:
    whens = bilingual_prefix_score_cases(fields, query, points)
    return Case(*whens, default=Value(0.0), output_field=FloatField())
