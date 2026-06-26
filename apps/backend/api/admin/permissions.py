from rest_framework.permissions import BasePermission

from api.admin.exceptions import AdminForbidden, AdminUnauthenticated


def is_authorized_admin_user(user) -> bool:
    return bool(
        user and user.is_authenticated and user.is_active and (user.is_staff or user.is_superuser)
    )


def is_superuser_admin(user) -> bool:
    return bool(user and user.is_authenticated and user.is_active and user.is_superuser)


class IsActiveAdminUser(BasePermission):
    """Allow authenticated, active Django staff or superusers."""

    message = "You do not have permission to access the admin area."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise AdminUnauthenticated()
        if not is_authorized_admin_user(request.user):
            raise AdminForbidden()
        return True


class IsActiveSuperuser(BasePermission):
    """Allow only authenticated, active Django superusers."""

    message = "You do not have permission to access the admin area."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise AdminUnauthenticated()
        if not is_superuser_admin(request.user):
            raise AdminForbidden()
        return True
