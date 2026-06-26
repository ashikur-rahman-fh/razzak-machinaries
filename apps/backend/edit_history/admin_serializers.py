from rest_framework import serializers


class EditHistoryEventSerializer(serializers.Serializer):
    id = serializers.CharField()
    eventType = serializers.CharField()
    occurredAt = serializers.DateTimeField()
    actorName = serializers.CharField(allow_null=True)
    reason = serializers.CharField(allow_null=True)
    entityType = serializers.CharField()
    entityId = serializers.IntegerField()
    entityLabelEn = serializers.CharField()
    entityLabelBn = serializers.CharField()
    status = serializers.CharField(allow_null=True)
    customerId = serializers.IntegerField(allow_null=True)
    transactionDisplayId = serializers.CharField(allow_null=True)
