from __future__ import annotations

import re

from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import (
    Case,
    FloatField,
    Q,
    QuerySet,
    Value,
    When,
)
from django.db.models.expressions import RawSQL
from django.db.models.functions import Coalesce, Greatest

from api.db.bilingual_search import (
    bilingual_field_icontains_q,
    bilingual_icontains_q,
    bilingual_icontains_score,
    bilingual_prefix_score,
    expand_bilingual_search_terms,
)
from customers.models import Customer
from customers.validators import (
    bangla_to_latin_digits,
    latin_to_bangla_digits,
    normalize_phone_search_term,
)

MIN_TRIGRAM_QUERY_LENGTH = 3
TRIGRAM_THRESHOLD = 0.2
PHONE_PARTIAL_MIN_DIGITS = 4

TRIGRAM_TEXT_FIELDS = (
    "full_name_bn",
    "full_name_en",
    "father_name_bn",
    "father_name_en",
    "address_bn",
    "address_en",
    "mediator_name_bn",
    "mediator_name_en",
)

NAME_FIELDS = ("full_name_bn", "full_name_en")
FATHER_NAME_FIELDS = ("father_name_bn", "father_name_en")
ADDRESS_FIELDS = ("address_bn", "address_en")
MEDIATOR_FIELDS = ("mediator_name_bn", "mediator_name_en")
SEARCHABLE_TEXT_FIELD_BASES = ("full_name", "address", "father_name", "mediator_name")
MEMO_FIELDS = ("memo_page_number_bn", "memo_page_number_en")


def normalize_search_text(search: str | None) -> str:
    return re.sub(r"\s+", " ", (search or "").strip())


def _search_tokens(query: str) -> list[str]:
    return [token for token in query.split() if token]


def _add_memo_icontains(combined: Q, query: str) -> Q:
    return combined | bilingual_field_icontains_q(query, *MEMO_FIELDS)


def _add_phone_icontains(combined: Q, query: str) -> Q:
    for term in expand_bilingual_search_terms(query):
        combined |= (
            Q(phone_bn__icontains=term) | Q(phone_en__icontains=term) | Q(phone__icontains=term)
        )

    for variant in normalize_phone_search_term(query):
        combined |= Q(phone__icontains=variant)
        combined |= Q(phone_bn__icontains=variant)
        combined |= Q(phone_en__icontains=variant)

    digits_only = re.sub(r"\D", "", bangla_to_latin_digits(query))
    if len(digits_only) >= PHONE_PARTIAL_MIN_DIGITS:
        combined |= Q(phone__icontains=digits_only)
        combined |= Q(phone_en__icontains=digits_only)
        bangla_digits = latin_to_bangla_digits(digits_only)
        if bangla_digits != digits_only:
            combined |= Q(phone_bn__icontains=bangla_digits)

    return combined


def _add_name_prefix(combined: Q, query: str) -> Q:
    for term in expand_bilingual_search_terms(query):
        combined |= Q(full_name_bn__istartswith=term) | Q(full_name_en__istartswith=term)
    return combined


def _build_single_token_filter(token: str) -> Q:
    combined = bilingual_icontains_q(token, *SEARCHABLE_TEXT_FIELD_BASES)
    combined = _add_memo_icontains(combined, token)
    combined = _add_phone_icontains(combined, token)
    combined = _add_name_prefix(combined, token)
    return combined


def build_base_customer_search_filter(query: str) -> Q:
    tokens = _search_tokens(query)
    if not tokens:
        return Q(pk__in=[])

    if len(tokens) == 1:
        return _build_single_token_filter(tokens[0])

    token_filters = [_build_single_token_filter(token) for token in tokens]
    combined = token_filters[0]
    for token_filter in token_filters[1:]:
        combined &= token_filter
    combined |= _build_single_token_filter(query)
    return combined


def build_customer_search_filter(query: str) -> Q:
    return build_base_customer_search_filter(query)


def _word_similarity_sql(field: str, token: str) -> RawSQL:
    return RawSQL(
        f"word_similarity(%s, {field})",
        [token],
        output_field=FloatField(),
    )


def _iter_trigram_tokens(query: str) -> list[str]:
    tokens = _search_tokens(query)
    if tokens:
        return [token for token in tokens if len(token) >= MIN_TRIGRAM_QUERY_LENGTH]
    if len(query) >= MIN_TRIGRAM_QUERY_LENGTH:
        return [query]
    return []


def _trigram_annotation_keys(token_index: int, field: str) -> tuple[str, str]:
    safe = field.replace("_", "")
    return f"trgm_sim_{token_index}_{safe}", f"trgm_wsim_{token_index}_{safe}"


def _token_trigram_match_q(token_index: int, token: str) -> Q:
    token_q = Q()
    for field in TRIGRAM_TEXT_FIELDS:
        sim_key, wsim_key = _trigram_annotation_keys(token_index, field)
        token_q |= Q(**{f"{sim_key}__gte": TRIGRAM_THRESHOLD})
        token_q |= Q(**{f"{wsim_key}__gte": TRIGRAM_THRESHOLD})
    return token_q


def _annotate_trigram_threshold_filter(
    queryset: QuerySet[Customer],
    query: str,
) -> tuple[QuerySet[Customer], Q]:
    tokens = _iter_trigram_tokens(query)
    if not tokens:
        return queryset, Q(pk__in=[])

    annotations: dict[str, RawSQL | TrigramSimilarity] = {}
    trigram_q = Q()
    for token_index, token in enumerate(tokens):
        for field in TRIGRAM_TEXT_FIELDS:
            sim_key, wsim_key = _trigram_annotation_keys(token_index, field)
            annotations[sim_key] = TrigramSimilarity(field, Value(token))
            annotations[wsim_key] = _word_similarity_sql(field, token)

        token_trigram_q = _token_trigram_match_q(token_index, token)
        if not trigram_q:
            trigram_q = token_trigram_q
        else:
            trigram_q &= token_trigram_q

    return queryset.annotate(**annotations), trigram_q


def _bilingual_trigram_score(fields: tuple[str, ...], query: str, weight: float):
    tokens = _iter_trigram_tokens(query)
    if not tokens:
        return Value(0.0, output_field=FloatField())

    similarities: list[TrigramSimilarity | RawSQL] = []
    for field in fields:
        for token in tokens:
            similarities.append(TrigramSimilarity(field, Value(token)))
            similarities.append(_word_similarity_sql(field, token))
    return Coalesce(Greatest(*similarities), Value(0.0)) * Value(weight)


def _memo_match_score(query: str) -> Case:
    whens = [
        When(**{f"{field}__icontains": term}, then=Value(50.0))
        for term in expand_bilingual_search_terms(query)
        for field in MEMO_FIELDS
    ]
    return Case(*whens, default=Value(0.0), output_field=FloatField())


def _token_memo_match_score(token: str) -> Case:
    return _memo_match_score(token)


def _phone_match_score(query: str) -> Case:
    full_whens: list[When] = []
    partial_whens: list[When] = []

    for term in expand_bilingual_search_terms(query):
        full_whens.extend(
            [
                When(phone_bn__icontains=term, then=Value(90.0)),
                When(phone_en__icontains=term, then=Value(90.0)),
                When(phone__icontains=term, then=Value(90.0)),
            ]
        )

    for variant in normalize_phone_search_term(query):
        digits = re.sub(r"\D", "", variant)
        if len(digits) >= 10:
            full_whens.extend(
                [
                    When(phone__icontains=variant, then=Value(90.0)),
                    When(phone_bn__icontains=variant, then=Value(90.0)),
                    When(phone_en__icontains=variant, then=Value(90.0)),
                ]
            )
        elif len(digits) >= PHONE_PARTIAL_MIN_DIGITS:
            partial_whens.extend(
                [
                    When(phone__icontains=variant, then=Value(60.0)),
                    When(phone_bn__icontains=variant, then=Value(60.0)),
                    When(phone_en__icontains=variant, then=Value(60.0)),
                ]
            )

    digits_only = re.sub(r"\D", "", bangla_to_latin_digits(query))
    if len(digits_only) >= PHONE_PARTIAL_MIN_DIGITS:
        partial_whens.extend(
            [
                When(phone__icontains=digits_only, then=Value(60.0)),
                When(phone_en__icontains=digits_only, then=Value(60.0)),
            ]
        )
        bangla_digits = latin_to_bangla_digits(digits_only)
        if bangla_digits != digits_only:
            partial_whens.append(When(phone_bn__icontains=bangla_digits, then=Value(60.0)))

    full_score = (
        Case(*full_whens, default=Value(0.0), output_field=FloatField())
        if full_whens
        else Value(0.0, output_field=FloatField())
    )
    partial_score = (
        Case(*partial_whens, default=Value(0.0), output_field=FloatField())
        if partial_whens
        else Value(0.0, output_field=FloatField())
    )
    return Greatest(full_score, partial_score)


def _token_phone_match_score(token: str) -> Case:
    return _phone_match_score(token)


def _aggregate_token_scores(tokens: list[str], score_builder) -> Case:
    if not tokens:
        return Value(0.0, output_field=FloatField())

    scores = [score_builder(token) for token in tokens]
    if len(scores) == 1:
        return scores[0]

    combined = scores[0]
    for score in scores[1:]:
        combined = combined + score
    return combined


def annotate_customer_search_rank(queryset: QuerySet[Customer], query: str) -> QuerySet[Customer]:
    tokens = _search_tokens(query) or [query]

    name_exact = _aggregate_token_scores(
        tokens,
        lambda token: bilingual_icontains_score(NAME_FIELDS, token, 100.0),
    )
    name_prefix = _aggregate_token_scores(
        tokens,
        lambda token: bilingual_prefix_score(NAME_FIELDS, token, 80.0),
    )
    name_trigram = _bilingual_trigram_score(NAME_FIELDS, query, 40.0)
    father_trigram = _bilingual_trigram_score(FATHER_NAME_FIELDS, query, 25.0)
    address_trigram = _bilingual_trigram_score(ADDRESS_FIELDS, query, 20.0)
    mediator_trigram = _bilingual_trigram_score(MEDIATOR_FIELDS, query, 15.0)
    memo_score = _aggregate_token_scores(tokens, _token_memo_match_score)
    phone_score = _aggregate_token_scores(tokens, _token_phone_match_score)

    phrase_name_exact = bilingual_icontains_score(NAME_FIELDS, query, 100.0)
    phrase_address_exact = bilingual_icontains_score(ADDRESS_FIELDS, query, 20.0)
    phrase_mediator_exact = bilingual_icontains_score(MEDIATOR_FIELDS, query, 15.0)

    return queryset.annotate(
        search_rank=(
            name_exact
            + name_prefix
            + name_trigram
            + father_trigram
            + address_trigram
            + mediator_trigram
            + memo_score
            + phone_score
            + phrase_name_exact
            + phrase_address_exact
            + phrase_mediator_exact
        )
    )


def apply_ranked_customer_search(
    queryset: QuerySet[Customer],
    search: str | None,
) -> QuerySet[Customer]:
    normalized = normalize_search_text(search)
    if not normalized:
        return queryset

    base_q = build_base_customer_search_filter(normalized)
    queryset, trigram_q = _annotate_trigram_threshold_filter(queryset, normalized)
    queryset = queryset.filter(base_q | trigram_q)
    return annotate_customer_search_rank(queryset, normalized)
