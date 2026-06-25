from django.urls import include, path, re_path

from geo.views import (
    public_geo_districts,
    public_geo_divisions,
    public_geo_unions,
    public_geo_upazilas,
    public_geo_villages,
)

from .admin.auth_views import admin_change_password, admin_csrf, admin_login, admin_logout, admin_me
from .admin.translation_views import AdminTranslationView
from .views import api_not_found, health, hello, public_meta

urlpatterns = [
    path("health/", health, name="health"),
    path("hello/", hello, name="hello"),
    path("public/meta/", public_meta, name="public-meta"),
    path("public/geo/divisions/", public_geo_divisions, name="public-geo-divisions"),
    path("public/geo/districts/", public_geo_districts, name="public-geo-districts"),
    path("public/geo/upazilas/", public_geo_upazilas, name="public-geo-upazilas"),
    path("public/geo/unions/", public_geo_unions, name="public-geo-unions"),
    path("public/geo/villages/", public_geo_villages, name="public-geo-villages"),
    path("admin/auth/csrf/", admin_csrf, name="admin-auth-csrf"),
    path("admin/auth/login/", admin_login, name="admin-auth-login"),
    path("admin/auth/logout/", admin_logout, name="admin-auth-logout"),
    path("admin/auth/me/", admin_me, name="admin-auth-me"),
    path("admin/auth/change-password/", admin_change_password, name="admin-auth-change-password"),
    path("admin/translations/", AdminTranslationView.as_view(), name="admin-translations"),
    path("admin/geo/", include("geo.urls")),
    path("admin/customers/", include("customers.urls")),
    path("admin/transactions/", include("transactions.urls")),
    re_path(r"^.*$", api_not_found, name="api-not-found"),
]
