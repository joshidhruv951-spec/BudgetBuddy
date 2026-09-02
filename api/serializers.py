from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(required=False, read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'