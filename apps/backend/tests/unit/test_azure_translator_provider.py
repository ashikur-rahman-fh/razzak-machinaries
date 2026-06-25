from api.services.translation.providers.azure import (
    _extract_translated_text,
    build_azure_translate_url,
)


def test_build_azure_translate_url():
    url = build_azure_translate_url(
        "https://example.cognitiveservices.azure.com",
        "bn",
        "en",
    )
    assert url == (
        "https://example.cognitiveservices.azure.com/translator/text/v3.0/translate"
        "?api-version=3.0&from=bn&to=en"
    )


def test_extract_translated_text():
    body = [{"translations": [{"text": " Hello ", "to": "en"}]}]
    assert _extract_translated_text(body) == "Hello"


def test_extract_translated_text_returns_none_for_invalid_body():
    assert _extract_translated_text({}) is None
    assert _extract_translated_text([]) is None
    assert _extract_translated_text([{"translations": []}]) is None
