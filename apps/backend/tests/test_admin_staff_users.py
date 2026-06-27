import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.test import APIClient

from api.admin.constants import (
    ADMIN_FORBIDDEN_CODE,
    FORBIDDEN_USER_RESPONSE_KEYS,
    INVALID_CREDENTIALS_CODE,
    INVALID_CREDENTIALS_MESSAGE,
    SAFE_USER_RESPONSE_KEYS,
)
from api.admin.password_utils import generate_readable_temporary_password
from api.models import AdminStaffProfile
from tests.factories import create_staff_user, create_superuser
from tests.test_api import assert_error_envelope

User = get_user_model()

pytestmark = pytest.mark.django_db

STAFF_USERS_URL = "/api/admin/staff-users/"
GENERATE_TEMP_PASSWORD_URL = "/api/admin/staff-users/generate-temp-password/"
ME_URL = "/api/admin/auth/me/"
LOGIN_URL = "/api/admin/auth/login/"
CSRF_URL = "/api/admin/auth/csrf/"
CHANGE_PASSWORD_URL = "/api/admin/auth/change-password/"


def _fetch_csrf(client: APIClient) -> str:
    response = client.get(CSRF_URL)
    assert response.status_code == 200
    return response.json()["csrfToken"]


def _login(client: APIClient, *, username_or_email: str, password: str):
    token = _fetch_csrf(client)
    return client.post(
        LOGIN_URL,
        {"usernameOrEmail": username_or_email, "password": password},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )


def _authenticated_post(client: APIClient, url: str, data=None):
    token = _fetch_csrf(client)
    return client.post(url, data or {}, format="json", HTTP_X_CSRFTOKEN=token)


def _authenticated_patch(client: APIClient, url: str, data=None):
    token = _fetch_csrf(client)
    return client.patch(url, data or {}, format="json", HTTP_X_CSRFTOKEN=token)


def _authenticated_get(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.get(url, HTTP_X_CSRFTOKEN=token)


def _staff_create_payload(**overrides):
    payload = {
        "firstName": "Karim",
        "lastName": "Ahmed",
        "username": "karim.staff",
        "email": "karim.staff@example.com",
        "phone": "01711112222",
        "isActive": True,
    }
    payload.update(overrides)
    return payload


def test_superuser_can_list_staff_users(api_client):
    create_superuser()
    create_staff_user(username="staff1")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_get(api_client, STAFF_USERS_URL)
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["username"] == "staff1"
    assert "temporaryPassword" not in body["results"][0]


def test_staff_cannot_access_staff_users_api(api_client):
    create_staff_user()
    _login(api_client, username_or_email="staff", password="staffpass123")

    response = _authenticated_get(api_client, STAFF_USERS_URL)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_unauthenticated_staff_users_api(api_client):
    response = api_client.get(STAFF_USERS_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_superuser_can_create_staff_user(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_post(api_client, STAFF_USERS_URL, _staff_create_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "karim.staff"
    assert body["isStaff"] is True
    assert body["isSuperuser"] is False
    assert body["mustChangePassword"] is False
    assert isinstance(body["temporaryPassword"], str)
    assert len(body["temporaryPassword"]) > 0

    user = User.objects.get(username="karim.staff")
    assert user.check_password(body["temporaryPassword"])
    assert user.password != body["temporaryPassword"]
    profile = AdminStaffProfile.objects.get(user=user)
    assert profile.must_change_password is False


def test_create_staff_user_hashes_password(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    plain = "Custom-Temp-8392-Safe!"

    response = _authenticated_post(
        api_client,
        STAFF_USERS_URL,
        _staff_create_payload(username="custom.staff", temporaryPassword=plain),
    )
    assert response.status_code == 201
    user = User.objects.get(username="custom.staff")
    assert user.check_password(plain)
    assert user.password != plain


def test_get_staff_user_detail_excludes_password(api_client):
    create_superuser()
    staff = create_staff_user(username="detail.staff")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_get(api_client, f"{STAFF_USERS_URL}{staff.pk}/")
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "detail.staff"
    assert "temporaryPassword" not in body
    assert "password" not in body


def test_generate_temp_password_meets_validation(api_client):
    create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_post(api_client, GENERATE_TEMP_PASSWORD_URL)
    assert response.status_code == 200
    password = response.json()["temporaryPassword"]
    assert isinstance(password, str)
    validate_password(password)


def test_generate_readable_password_helper():
    password = generate_readable_temporary_password()
    validate_password(password)
    assert "-" in password


def test_superuser_can_update_staff_user(api_client):
    create_superuser()
    staff = create_staff_user(username="update.staff", first_name="Old", last_name="Name")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_patch(
        api_client,
        f"{STAFF_USERS_URL}{staff.pk}/",
        {"firstName": "New", "phone": "01800001111"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["firstName"] == "New"
    assert body["phone"] == "01800001111"


def test_superuser_can_deactivate_staff_user(api_client):
    create_superuser()
    staff = create_staff_user(username="deactivate.staff")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_patch(
        api_client,
        f"{STAFF_USERS_URL}{staff.pk}/",
        {"isActive": False},
    )
    assert response.status_code == 200
    staff.refresh_from_db()
    assert staff.is_active is False


def test_inactive_staff_cannot_login(api_client):
    create_staff_user(username="inactive.staff", is_active=False)
    response = _login(api_client, username_or_email="inactive.staff", password="staffpass123")
    assert_error_envelope(response, status_code=401, code=INVALID_CREDENTIALS_CODE)
    assert response.json()["error"]["message"] == INVALID_CREDENTIALS_MESSAGE


def test_reset_temp_password_returns_once(api_client):
    create_superuser()
    staff = create_staff_user(username="reset.staff")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_post(api_client, f"{STAFF_USERS_URL}{staff.pk}/reset-temp-password/")
    assert response.status_code == 200
    body = response.json()
    assert "temporaryPassword" in body
    staff.refresh_from_db()
    profile = AdminStaffProfile.objects.get(user=staff)
    assert profile.must_change_password is False


def test_staff_can_change_password_with_temporary_password(api_client):
    create_staff_user(username="temp.staff", password="OldTemp8392!Safe")
    _login(api_client, username_or_email="temp.staff", password="OldTemp8392!Safe")

    response = _authenticated_post(
        api_client,
        CHANGE_PASSWORD_URL,
        {
            "currentPassword": "OldTemp8392!Safe",
            "newPassword": "NewSecure8392!Pass",
            "confirmPassword": "NewSecure8392!Pass",
        },
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}

    user = User.objects.get(username="temp.staff")
    assert user.check_password("NewSecure8392!Pass")


def test_duplicate_username_rejected(api_client):
    create_superuser()
    create_staff_user(username="dup.staff")
    _login(api_client, username_or_email="admin", password="adminpass123")

    response = _authenticated_post(
        api_client,
        STAFF_USERS_URL,
        _staff_create_payload(username="dup.staff"),
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_login_returns_must_change_password_false(api_client):
    create_staff_user(username="flag.staff", password="OldTemp8392!Safe")
    response = _login(api_client, username_or_email="flag.staff", password="OldTemp8392!Safe")
    assert response.status_code == 200
    assert set(response.json().keys()) == SAFE_USER_RESPONSE_KEYS
    assert response.json()["mustChangePassword"] is False
    for key in FORBIDDEN_USER_RESPONSE_KEYS:
        assert key not in response.json()
