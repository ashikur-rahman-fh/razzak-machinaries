import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from customers.models import Customer, CustomerVersion
from customers.services import create_customer_with_version
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
        "father_name_bn": "বাবা",
        "father_name_en": "Father",
        "memo_page_number_bn": "১",
        "memo_page_number_en": "1",
        "mediator_name_bn": "",
        "mediator_name_en": "",
    }
    data.update(overrides)
    return create_customer_with_version(**data)


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


def _auth_delete(client: APIClient, url: str):
    token = _fetch_csrf(client)
    return client.delete(url, HTTP_X_CSRFTOKEN=token)


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


def test_create_customer_version(superuser_client):
    customer = _create_customer()
    response = _auth_post_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/create-version/",
        {
            "fullNameBn": customer.full_name_bn,
            "fullNameEn": "Ali Updated",
            "addressBn": customer.address_bn,
            "addressEn": customer.address_en,
            "phoneBn": customer.phone_bn,
            "phoneEn": customer.phone_en,
            "fatherNameBn": customer.father_name_bn,
            "fatherNameEn": customer.father_name_en,
            "memoPageNumberBn": customer.memo_page_number_bn,
            "memoPageNumberEn": customer.memo_page_number_en,
            "changeReason": "Corrected spelling",
        },
    )
    assert response.status_code == 201
    customer.refresh_from_db()
    assert customer.full_name_en == "Ali Updated"
    versions = CustomerVersion.objects.filter(customer=customer).order_by("version_number")
    assert versions.count() == 2
    assert versions.last().is_current is True
    assert versions.first().is_current is False


def test_customer_history_returns_all_versions(superuser_client):
    customer = _create_customer()
    _auth_post_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/create-version/",
        {
            "fullNameBn": customer.full_name_bn,
            "fullNameEn": "Ali Updated",
            "addressBn": customer.address_bn,
            "addressEn": "Updated address",
            "phoneBn": customer.phone_bn,
            "phoneEn": customer.phone_en,
            "fatherNameBn": customer.father_name_bn,
            "fatherNameEn": customer.father_name_en,
            "memoPageNumberBn": customer.memo_page_number_bn,
            "memoPageNumberEn": customer.memo_page_number_en,
            "changeReason": "Corrected spelling",
        },
    )

    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}{customer.id}/history/")
    assert response.status_code == 200
    assert response.data["customerId"] == customer.id
    assert len(response.data["versions"]) == 2
    assert response.data["versions"][0]["versionNumber"] == 1
    assert response.data["versions"][1]["versionNumber"] == 2
    assert response.data["versions"][1]["isCurrent"] is True
    assert response.data["versions"][1]["previousVersionId"] == response.data["versions"][0]["id"]
    assert response.data["versions"][1]["fullNameEn"] == "Ali Updated"
    assert response.data["versions"][1]["changeReason"] == "Corrected spelling"


def test_customer_requires_auth(api_client):
    response = api_client.get(CUSTOMERS_URL)
    assert_error_envelope(response, status_code=401, code="UNAUTHORIZED")


def test_customer_forbidden_for_non_superuser(api_client):
    user = _create_regular_user(username="staff", password="staffpass123")
    api_client.force_login(user)
    token = _fetch_csrf(api_client)
    response = api_client.get(CUSTOMERS_URL, HTTP_X_CSRFTOKEN=token)
    assert_error_envelope(response, status_code=403, code=ADMIN_FORBIDDEN_CODE)


def test_list_customers_pagination(superuser_client):
    for index in range(3):
        _create_customer(phone=f"+880171111111{index}", phone_en=f"0171111111{index}")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?page=1&pageSize=2")
    assert response.status_code == 200
    assert response.data["count"] == 3
    assert len(response.data["results"]) == 2


def test_get_customer_detail(superuser_client):
    customer = _create_customer()
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}{customer.id}/")
    assert response.status_code == 200
    assert response.data["id"] == customer.id
    assert response.data["fullNameBn"] == "আলী"
    assert response.data["phone"] == "+8801711111111"
    assert "profilePictureUrl" in response.data


def test_archive_customer(superuser_client):
    customer = _create_customer()
    response = _auth_post_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/archive/",
        {"archiveReason": "Duplicate account"},
    )
    assert response.status_code == 200
    customer.refresh_from_db()
    assert customer.is_archived is True
    assert customer.archive_reason == "Duplicate account"
    list_response = _auth_get(superuser_client, CUSTOMERS_URL)
    assert list_response.data["count"] == 0
    archived_response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?status=archived")
    assert archived_response.data["count"] == 1


def test_patch_customer_not_allowed(superuser_client):
    customer = _create_customer()
    response = _auth_patch_json(
        superuser_client,
        f"{CUSTOMERS_URL}{customer.id}/",
        {"fullNameEn": "Ali Updated"},
    )
    assert response.status_code == 405


def test_delete_customer_not_allowed(superuser_client):
    customer = _create_customer()
    response = _auth_delete(superuser_client, f"{CUSTOMERS_URL}{customer.id}/")
    assert response.status_code == 405
    assert Customer.objects.filter(id=customer.id).exists()


def test_search_customers_by_bangla_name(superuser_client):
    _create_customer(full_name_bn="রহিম উদ্দিন", full_name_en="Rahim Uddin")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=রহিম")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_by_english_name(superuser_client):
    _create_customer(full_name_en="Rahim Uddin")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=rahim")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_by_address(superuser_client):
    _create_customer(address_bn="গ্রাম: চরপাড়া", address_en="Village: Charpara")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=চরপাড়া")
    assert response.status_code == 200
    assert response.data["count"] == 1
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=charpara")
    assert response.data["count"] == 1


def test_search_customers_by_father_name(superuser_client):
    _create_customer(father_name_bn="করিম", father_name_en="Karim")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=করিম")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_by_mediator(superuser_client):
    _create_customer(mediator_name_bn="মাধ্যম আলী", mediator_name_en="Mediator Ali")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=মাধ্যম")
    assert response.status_code == 200
    assert response.data["count"] == 1
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=mediator")
    assert response.data["count"] == 1


def test_search_customers_by_memo_page(superuser_client):
    _create_customer(memo_page_number_bn="৪৫৬", memo_page_number_en="456")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=456")
    assert response.status_code == 200
    assert response.data["count"] == 1
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=৪৫৬")
    assert response.data["count"] == 1


def test_search_customers_memo_cross_script_when_only_one_locale_stored(superuser_client):
    _create_customer(memo_page_number_bn="৪৫৬", memo_page_number_en="")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=456")
    assert response.status_code == 200
    assert response.data["count"] == 1

    _create_customer(
        memo_page_number_bn="",
        memo_page_number_en="789",
        phone="+8801711111122",
        phone_en="01711111122",
        phone_bn="০১৭১১১১১১১২২",
    )
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=৭৮৯")
    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.parametrize(
    "search_term",
    ["01711111111", "+8801711111111", "8801711111111", "০১৭১১১১১১১১১"],
)
def test_search_customers_by_phone_variants(superuser_client, search_term):
    _create_customer()
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search={search_term}")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_by_partial_phone(superuser_client):
    _create_customer()
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=171111")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_list_customers_default_ordering_newest_first(superuser_client):
    first = _create_customer(full_name_en="First", phone="+8801711111110", phone_en="01711111110")
    second = _create_customer(full_name_en="Second", phone="+8801711111112", phone_en="01711111112")
    response = _auth_get(superuser_client, CUSTOMERS_URL)
    assert response.status_code == 200
    ids = [item["id"] for item in response.data["results"]]
    assert ids.index(second.id) < ids.index(first.id)


def test_list_customers_ordering_by_name(superuser_client):
    _create_customer(full_name_en="Zara", phone="+8801711111113", phone_en="01711111113")
    _create_customer(full_name_en="Amir", phone="+8801711111114", phone_en="01711111114")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?ordering=fullNameEn")
    assert response.status_code == 200
    names = [item["fullNameEn"] for item in response.data["results"]]
    assert names == sorted(names)


def test_search_customers_fuzzy_english_name(superuser_client):
    _create_customer(full_name_en="Rahim Uddin")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=raheem")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_fuzzy_address(superuser_client):
    _create_customer(address_en="Village: Charpara")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=charpar")
    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.parametrize(
    ("search_term", "overrides"),
    [
        ("uddin", {"full_name_en": "Rahim Uddin"}),
        ("arpara", {"address_en": "Village Charpara, Dhaka"}),
        ("17111111", {"phone": "+8801711111111", "phone_en": "01711111111"}),
        ("Khan", {"mediator_name_en": "Mediator Ali Khan"}),
        ("মাধ্য", {"mediator_name_bn": "মাধ্যম আলী"}),
    ],
)
def test_search_customers_middle_substrings(superuser_client, search_term, overrides):
    _create_customer(**overrides)
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search={search_term}")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_multi_token_matches_across_fields(superuser_client):
    _create_customer(
        full_name_en="Rahim Uddin",
        address_en="Village Charpara, Dhaka",
        phone="+8801711111119",
        phone_en="01711111119",
    )
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=uddin%20charpara")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_multi_token_requires_all_tokens(superuser_client):
    _create_customer(
        full_name_en="Rahim Uddin",
        address_en="Village Charpara, Dhaka",
        phone="+8801711111121",
        phone_en="01711111121",
    )
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=uddin%20dhaka")
    assert response.status_code == 200
    assert response.data["count"] == 1
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=uddin%20chittagong")
    assert response.data["count"] == 0


def test_search_customers_short_query_still_matches(superuser_client):
    _create_customer(full_name_en="Rahim Uddin")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=ra")
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_customers_ranks_exact_name_first(superuser_client):
    _create_customer(
        full_name_en="Rahim Ali",
        full_name_bn="রহিম আলী",
        phone="+8801711111115",
        phone_en="01711111115",
    )
    uddin = _create_customer(
        full_name_en="Rahim Uddin",
        full_name_bn="রহিম উদ্দিন",
        phone="+8801711111116",
        phone_en="01711111116",
    )
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=rahim%20uddin")
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == uddin.id


def test_search_customers_explicit_sort_overrides_relevance(superuser_client):
    _create_customer(full_name_en="Zara", phone="+8801711111117", phone_en="01711111117")
    _create_customer(full_name_en="Amir", phone="+8801711111118", phone_en="01711111118")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?search=am&ordering=fullNameEn")
    assert response.status_code == 200
    names = [item["fullNameEn"] for item in response.data["results"]]
    assert names == sorted(names)


def test_search_customers_relevance_ordering_param(superuser_client):
    _create_customer(full_name_en="Rahim Uddin", phone="+8801711111119", phone_en="01711111119")
    _create_customer(full_name_en="Rahim Ali", phone="+8801711111120", phone_en="01711111120")
    response = _auth_get(
        superuser_client, f"{CUSTOMERS_URL}?search=rahim%20uddin&ordering=relevance"
    )
    assert response.status_code == 200
    assert response.data["results"][0]["fullNameEn"] == "Rahim Uddin"


def test_list_customers_relevance_ordering_without_search_returns_200(superuser_client):
    _create_customer(full_name_en="Amir", phone="+8801711111121", phone_en="01711111121")
    response = _auth_get(superuser_client, f"{CUSTOMERS_URL}?ordering=relevance")
    assert response.status_code == 200
    assert response.data["count"] >= 1
