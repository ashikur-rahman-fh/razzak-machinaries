import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from customers.models import Customer
from tests.test_admin_auth import (
    ADMIN_FORBIDDEN_CODE,
    _create_regular_user,
    _create_superuser,
    _fetch_csrf,
    _login,
)
from tests.test_api import assert_error_envelope

pytestmark = pytest.mark.django_db

CUSTOMERS_URL = "/api/admin/customers/"


def _make_test_image(name: str = "photo.jpg", fmt: str = "JPEG") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), color="red").save(buffer, format=fmt)
    buffer.seek(0)
    content_type = "image/jpeg" if fmt == "JPEG" else f"image/{fmt.lower()}"
    return SimpleUploadedFile(name, buffer.read(), content_type=content_type)


def _valid_customer_payload(**overrides):
    payload = {
        "fullNameBn": "রহিম উদ্দিন",
        "fullNameEn": "Rahim Uddin",
        "addressBn": "ঢাকা, বাংলাদেশ",
        "addressEn": "Dhaka, Bangladesh",
        "phoneBn": "০১৭১২৩৪৫৬৭৮",
        "phoneEn": "01712345678",
        "fatherNameBn": "করিম উদ্দিন",
        "fatherNameEn": "Karim Uddin",
        "memoPageNumberBn": "১২৩",
        "memoPageNumberEn": "123",
        "mediatorNameBn": "",
        "mediatorNameEn": "",
    }
    payload.update(overrides)
    return payload


def _create_customer(**overrides):
    data = {
        "full_name_bn": "আলী",
        "full_name_en": "Ali",
        "address_bn": "ঠিকানা",
        "address_en": "Address",
        "phone_bn": "০১৭১১১১১১১১১",
        "phone_en": "01711111111",
        "phone": "+8801711111111",
        "father_name_bn": "বাবা",
        "father_name_en": "Father",
        "memo_page_number_bn": "১",
        "memo_page_number_en": "1",
    }
    data.update(overrides)
    return Customer.objects.create(**data)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def superuser_client(api_client):
    _create_superuser()
    _login(api_client, username_or_email="admin", password="adminpass123")
    return api_client


def _auth_post_json(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.post(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _auth_post_multipart(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.post(url, data, format="multipart", HTTP_X_CSRFTOKEN=token)


def _auth_patch_json(client: APIClient, url: str, data):
    token = _fetch_csrf(client)
    return client.patch(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def _auth_get(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.get(url, HTTP_X_CSRFTOKEN=token)


def test_create_customer_json(superuser_client):
    response = _auth_post_json(superuser_client, CUSTOMERS_URL, _valid_customer_payload())
    assert response.status_code == 201
    assert response.data["fullNameBn"] == "রহিম উদ্দিন"
    assert response.data["phoneBn"] == "০১৭১২৩৪৫৬৭৮"
    assert response.data["phoneEn"] == "01712345678"
    assert response.data["phone"] == "+8801712345678"
    assert response.data["memoPageNumberBn"] == "১২৩"
    assert response.data["memoPageNumberEn"] == "123"
    customer = Customer.objects.get()
    assert customer.phone_bn == "০১৭১২৩৪৫৬৭৮"
    assert customer.memo_page_number_en == "123"


def test_create_customer_multipart_with_profile_picture(superuser_client):
    data = _valid_customer_payload()
    data["profilePicture"] = _make_test_image()
    response = _auth_post_multipart(superuser_client, CUSTOMERS_URL, data)
    assert response.status_code == 201
    assert response.data["profilePictureUrl"] is not None
    customer = Customer.objects.get()
    assert customer.profile_picture


def test_create_customer_rejects_invalid_phone(superuser_client):
    response = _auth_post_json(
        superuser_client,
        CUSTOMERS_URL,
        _valid_customer_payload(phoneEn="12345"),
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_create_customer_rejects_memo_with_letters(superuser_client):
    response = _auth_post_json(
        superuser_client,
        CUSTOMERS_URL,
        _valid_customer_payload(memoPageNumberEn="12A"),
    )
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_create_customer_accepts_bangla_phone_digits(superuser_client):
    response = _auth_post_json(
        superuser_client,
        CUSTOMERS_URL,
        _valid_customer_payload(phoneEn="০১৯৮৭৬৫৪৩২১"),
    )
    assert response.status_code == 201
    assert response.data["phone"] == "+8801987654321"


def test_create_customer_rejects_invalid_image(superuser_client):
    data = _valid_customer_payload()
    data["profilePicture"] = SimpleUploadedFile(
        "bad.txt",
        b"not an image",
        content_type="text/plain",
    )
    response = _auth_post_multipart(superuser_client, CUSTOMERS_URL, data)
    assert_error_envelope(response, status_code=400, code="VALIDATION_ERROR")


def test_list_customers(superuser_client):
    _create_customer()
    response = _auth_get(superuser_client, CUSTOMERS_URL)
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["fullNameEn"] == "Ali"


def test_search_customers_by_phone(superuser_client):
    _create_customer()
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=1711111111")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_update_customer(superuser_client):
    customer = _create_customer()
    response = _auth_patch_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/",
        {"fullNameEn": "Ali Updated"},
    )
    assert response.status_code == 200
    customer.refresh_from_db()
    assert customer.full_name_en == "Ali Updated"


def test_customer_requires_auth(api_client):
    response = api_client.get(CUSTOMERS_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_customer_forbidden_for_non_superuser(api_client):
    user = _create_regular_user(username="staff", password="staffpass123")
    api_client.force_login(user)
    token = _fetch_csrf(api_client)
    response = api_client.get(CUSTOMERS_URL, HTTP_X_CSRFTOKEN=token)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)
