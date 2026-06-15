from django.db import models


class BilingualGeoNameMixin(models.Model):
    name_en = models.CharField(max_length=255)
    name_bn = models.CharField(max_length=255)

    class Meta:
        abstract = True
        ordering = ["name_en"]

    def __str__(self) -> str:
        return self.name_en


class Division(BilingualGeoNameMixin):
    id = models.PositiveIntegerField(primary_key=True)

    class Meta(BilingualGeoNameMixin.Meta):
        verbose_name = "division"
        verbose_name_plural = "divisions"


class District(BilingualGeoNameMixin):
    id = models.PositiveIntegerField(primary_key=True)
    division = models.ForeignKey(
        Division,
        on_delete=models.PROTECT,
        related_name="districts",
    )

    class Meta(BilingualGeoNameMixin.Meta):
        verbose_name = "district"
        verbose_name_plural = "districts"
        indexes = [
            models.Index(fields=["division"]),
        ]


class Upazila(BilingualGeoNameMixin):
    id = models.PositiveIntegerField(primary_key=True)
    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name="upazilas",
    )

    class Meta(BilingualGeoNameMixin.Meta):
        verbose_name = "upazila"
        verbose_name_plural = "upazilas"
        indexes = [
            models.Index(fields=["district"]),
        ]


class Union(BilingualGeoNameMixin):
    id = models.PositiveIntegerField(primary_key=True)
    upazila = models.ForeignKey(
        Upazila,
        on_delete=models.PROTECT,
        related_name="unions",
    )

    class Meta(BilingualGeoNameMixin.Meta):
        verbose_name = "union"
        verbose_name_plural = "unions"
        indexes = [
            models.Index(fields=["upazila"]),
        ]


class Village(BilingualGeoNameMixin):
    id = models.PositiveIntegerField(primary_key=True)

    class Meta(BilingualGeoNameMixin.Meta):
        verbose_name = "village"
        verbose_name_plural = "villages"
