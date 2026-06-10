import pytest
from rest_framework.exceptions import ValidationError

from api.serializers.bilingual import (
    bilingual_camel_case_names,
    bilingual_field_names,
    validate_bilingual_pair,
)


def test_bilingual_field_names():
    assert bilingual_field_names("title") == ("title_en", "title_bn")


def test_bilingual_camel_case_names():
    assert bilingual_camel_case_names("title") == ("titleEn", "titleBn")


def test_validate_bilingual_pair_requires_one_locale():
    validate_bilingual_pair("English", None, field_label="Title")
    validate_bilingual_pair(None, "বাংলা", field_label="Title")

    with pytest.raises(ValidationError, match="Title must be provided in at least one language."):
        validate_bilingual_pair("", "   ", field_label="Title")
