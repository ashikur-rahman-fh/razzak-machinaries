from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.admin.authentication import AdminSessionAuthentication
from api.admin.permissions import IsActiveAdminUser
from api.services.translation import translate
from api.services.translation.exceptions import TranslationFailed


class TranslationApiThrottle(ScopedRateThrottle):
    scope = "admin_translation"


class TranslationRequestSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000, trim_whitespace=True)
    source = serializers.ChoiceField(choices=["bn", "en"])
    target = serializers.ChoiceField(choices=["bn", "en"])

    def validate(self, attrs):
        text = attrs.get("text", "").strip()
        if not text:
            raise ValidationError({"text": "This field is required."})

        source = attrs["source"]
        target = attrs["target"]
        if source == target:
            raise ValidationError({"target": "Source and target languages must differ."})

        attrs["text"] = text
        return attrs


class AdminTranslationView(APIView):
    authentication_classes = [AdminSessionAuthentication]
    permission_classes = [IsActiveAdminUser]
    throttle_classes = [TranslationApiThrottle]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = TranslationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = translate(
                serializer.validated_data["text"],
                serializer.validated_data["source"],
                serializer.validated_data["target"],
            )
        except TranslationFailed as exc:
            raise exc

        return Response(
            {
                "translatedText": result.translated_text,
                "provider": result.provider,
            },
            status=status.HTTP_200_OK,
        )
