from django.contrib.auth import get_user_model

from api.admin.staff_profile import ensure_staff_profile

User = get_user_model()


def create_superuser(username="admin", password="adminpass123", **kwargs):
    defaults = {
        "email": f"{username}@example.com",
        "is_superuser": True,
        "is_staff": True,
        "is_active": True,
    }
    defaults.update(kwargs)
    user = User.objects.create_user(username=username, password=password, **defaults)
    ensure_staff_profile(user, must_change_password=False)
    return user


def create_regular_user(username="user", password="userpass123", **kwargs):
    defaults = {"email": f"{username}@example.com", "is_active": True}
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password=password, **defaults)


def create_staff_user(username="staff", password="staffpass123", **kwargs):
    defaults = {
        "email": f"{username}@example.com",
        "is_staff": True,
        "is_superuser": False,
        "is_active": True,
    }
    defaults.update(kwargs)
    user = User.objects.create_user(username=username, password=password, **defaults)
    ensure_staff_profile(user, must_change_password=False)
    return user
