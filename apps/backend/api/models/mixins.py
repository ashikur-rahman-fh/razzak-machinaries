from django.core.exceptions import ValidationError
from django.db import models


class BilingualContentMixin(models.Model):
    """
    Abstract mixin documenting the bilingual field pattern for user-facing content.

    Concrete models should declare fields such as title_en/title_bn or
    description_en/description_bn and validate that at least one locale is present.
    """

    class Meta:
        abstract = True

    @staticmethod
    def validate_at_least_one_locale(*values: str | None, field_label: str = "Content") -> None:
        if not any(value and value.strip() for value in values):
            raise ValidationError(f"{field_label} must be provided in at least one language.")
